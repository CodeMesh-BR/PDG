<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

use Google\Cloud\Vision\V1\Client\ImageAnnotatorClient;
use Google\Cloud\Vision\V1\Image;
use Google\Cloud\Vision\V1\Feature;
use Google\Cloud\Vision\V1\AnnotateImageRequest;
use Google\Cloud\Vision\V1\BatchAnnotateImagesRequest;
use Google\Cloud\Vision\V1\ImageContext;

class PlateOcrController extends Controller
{
    public function readPlate(Request $http)
    {
        try {
            // Allow up to 20MB for high-resolution mobile camera captures, then resize if necessary.
            $http->validate(['image' => 'required|file|max:20480']);

            $image = $http->file('image');
            if (!$image || !$image->isValid()) {
                return response()->json([
                    'plate' => '',
                    'score' => 0,
                    'error' => 'invalid_image_upload',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $mimeType = strtolower((string)($image->getMimeType() ?? ''));
            $clientMime = strtolower((string)($image->getClientMimeType() ?? ''));
            $extension = strtolower((string)($image->getClientOriginalExtension() ?? ''));

            if (!$this->isAllowedUploadMime($mimeType, $clientMime, $extension)) {
                return response()->json([
                    'plate' => '',
                    'score' => 0,
                    'error' => 'unsupported_image_type',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $imageContent = file_get_contents($image->getRealPath());
            $imageSize = $image->getSize() ?: strlen($imageContent);

            $size = @getimagesizefromstring($imageContent);
            $imgW = (int)($size[0] ?? 0);
            $imgH = (int)($size[1] ?? 0);

            if ($imageSize > 10 * 1024 * 1024 && function_exists('imagecreatefromstring')) {
                Log::info('OCR image from camera is large; attempting resize', [
                    'original_size' => $imageSize,
                    'original_width' => $imgW,
                    'original_height' => $imgH,
                ]);

                $srcImage = @imagecreatefromstring($imageContent);
                if ($srcImage !== false && $imgW > 0 && $imgH > 0) {
                    $maxDimension = 2048;
                    if ($imgW > $maxDimension || $imgH > $maxDimension) {
                        $scale = min($maxDimension / $imgW, $maxDimension / $imgH);
                        $newW = max(1, (int)round($imgW * $scale));
                        $newH = max(1, (int)round($imgH * $scale));

                        $resized = imagecreatetruecolor($newW, $newH);
                        imagecopyresampled($resized, $srcImage, 0, 0, 0, 0, $newW, $newH, $imgW, $imgH);

                        ob_start();
                        imagejpeg($resized, null, 80);
                        $jpegContent = ob_get_clean();

                        if ($jpegContent !== false) {
                            $imageContent = $jpegContent;
                            $imgW = $newW;
                            $imgH = $newH;
                        }

                        imagedestroy($resized);
                    }
                    imagedestroy($srcImage);
                }
            }

            $client = new ImageAnnotatorClient(['transport' => 'rest']);

            $img = (new Image())->setContent($imageContent);

            $featTxt = (new Feature())->setType(Feature\Type::TEXT_DETECTION);
            $featObj = (new Feature())->setType(Feature\Type::OBJECT_LOCALIZATION);

            $ctx = (new ImageContext())->setLanguageHints([env('GCV_LOCALE_HINT', 'en')]);

            $annotReq = (new AnnotateImageRequest())
                ->setImage($img)
                ->setFeatures([$featTxt, $featObj])
                ->setImageContext($ctx);

            $batchReq = (new BatchAnnotateImagesRequest())->setRequests([$annotReq]);

            $batchRes = $client->batchAnnotateImages($batchReq);
            $client->close();

            $responses = $batchRes->getResponses();
            if (empty($responses) || $responses[0]->hasError()) {
                if (!empty($responses) && $responses[0]->hasError()) {
                    Log::warning('OCR Google Vision error', ['error' => $responses[0]->getError()]);
                }
                return response()->json(['plate' => '', 'score' => 0], Response::HTTP_OK);
            }

            $res = $responses[0];

            $textAnn = $res->getTextAnnotations();
            $fullText = '';
            if ($textAnn && count($textAnn) > 0) {
                $fullText = (string)($textAnn[0]->getDescription() ?? '');
            }

            if ($imgW <= 0 || $imgH <= 0) {
                $inferredBounds = $this->inferImageBoundsFromTextAnnotations($textAnn);
                if ($inferredBounds) {
                    $imgW = $inferredBounds['x2'];
                    $imgH = $inferredBounds['y2'];
                }
            }

            $imgW = max(1, $imgW);
            $imgH = max(1, $imgH);

            $vehicleBox = $this->detectVehicleBox($res, $imgW, $imgH);
            $plateZone = $this->plateZoneBox($vehicleBox, $imgW, $imgH);

            $plate = $this->pickPlateByLargestLine($textAnn, $plateZone);
            if ($plate === '') {
                $plate = $this->pickPlateByLargestLine($textAnn, [
                    'x1' => 0,
                    'y1' => 0,
                    'x2' => $imgW,
                    'y2' => $imgH,
                ]);
            }
            if ($plate === '') {
                $plate = $this->pickPlateFromFullText($fullText);
            }

            return response()->json([
                'plate' => $plate,
                'score' => $plate !== '' ? 200 : 0,
                'debug_raw_google' => $fullText,
                'debug_vehicle_box' => $vehicleBox,
                'debug_plate_zone' => $plateZone,
            ], Response::HTTP_OK);
        } catch (\Throwable $e) {
            Log::error('OCR error: ' . $e->getMessage(), ['file' => $e->getFile(), 'line' => $e->getLine()]);
            return response()->json(['error' => 'internal_error', 'message' => $e->getMessage()], 500);
        }
    }

    private function pickPlateByLargestLine($textAnn, array $plateZone): string
    {
        if (!$textAnn || count($textAnn) < 2) return '';

        $tokens = [];

        for ($i = 1; $i < count($textAnn); $i++) {
            $desc = strtoupper(trim((string)($textAnn[$i]->getDescription() ?? '')));
            if ($desc === '') continue;

            $poly = $textAnn[$i]->getBoundingPoly();
            if (!$poly || !$poly->getVertices()) continue;

            $box = $this->absPolyToBox($poly->getVertices());
            if ($this->boxArea($box) <= 0) continue;

            if (!$this->centerInside($box, $plateZone)) continue;

            $norm = $this->normalizeToken($desc);
            if ($norm === '') continue;

            $tokens[] = [
                'text' => $norm,
                'box' => $box,
                'area' => $this->boxArea($box),
                'cx' => ($box['x1'] + $box['x2']) / 2,
                'cy' => ($box['y1'] + $box['y2']) / 2,
                'w' => max(1, $box['x2'] - $box['x1']),
                'h' => max(1, $box['y2'] - $box['y1']),
            ];
        }

        if (!$tokens) return '';

        usort($tokens, fn($a, $b) => $a['cy'] <=> $b['cy']);

        $zoneH = max(1, $plateZone['y2'] - $plateZone['y1']);
        $lineTol = $zoneH * 0.075;

        $lines = [];
        $cur = [
            'tokens' => [],
            'sumArea' => 0,
            'sumH' => 0,
            'count' => 0,
            'cyMean' => null,
        ];

        foreach ($tokens as $t) {
            if ($cur['cyMean'] === null) {
                $cur['tokens'] = [$t];
                $cur['sumArea'] = $t['area'];
                $cur['sumH'] = $t['h'];
                $cur['count'] = 1;
                $cur['cyMean'] = $t['cy'];
                continue;
            }

            if (abs($t['cy'] - $cur['cyMean']) <= $lineTol) {
                $cur['tokens'][] = $t;
                $cur['sumArea'] += $t['area'];
                $cur['sumH'] += $t['h'];
                $cur['count'] += 1;
                $cur['cyMean'] = $cur['cyMean'] + (($t['cy'] - $cur['cyMean']) / $cur['count']);
                continue;
            }

            $lines[] = $cur;
            $cur = [
                'tokens' => [$t],
                'sumArea' => $t['area'],
                'sumH' => $t['h'],
                'count' => 1,
                'cyMean' => $t['cy'],
            ];
        }

        $lines[] = $cur;

        $bestLine = null;
        $bestKey = null;

        foreach ($lines as $ln) {
            $avgH = $ln['sumH'] / max(1, $ln['count']);
            $key = [$ln['sumArea'], $avgH, $ln['count']];

            if ($bestKey === null || $this->cmpKey($key, $bestKey) > 0) {
                $bestKey = $key;
                $bestLine = $ln;
            }
        }

        if (!$bestLine || empty($bestLine['tokens'])) return '';

        $lineTokens = $bestLine['tokens'];
        usort($lineTokens, fn($a, $b) => $a['cx'] <=> $b['cx']);

        $out = '';
        $prev = null;

        $avgW = 0;
        foreach ($lineTokens as $t) $avgW += $t['w'];
        $avgW = $avgW / max(1, count($lineTokens));

        foreach ($lineTokens as $t) {
            if ($prev) {
                $gap = $t['box']['x1'] - $prev['box']['x2'];
                if ($gap > $avgW * 0.35 && !str_ends_with($out, '-') && !str_starts_with($t['text'], '-')) {
                    $out .= '-';
                }
            }
            $out .= $t['text'];
            $prev = $t;
        }

        $out = strtoupper($out);
        $out = preg_replace('/[^A-Z0-9\-]/', '', $out);
        $out = preg_replace('/\-+/', '-', $out);
        $out = trim($out, '-');

        $plain = str_replace('-', '', $out);
        if (strlen($plain) < 4 || strlen($plain) > 10) return '';

        return $out;
    }

    private function cmpKey(array $a, array $b): int
    {
        if ($a[0] !== $b[0]) return $a[0] <=> $b[0];
        if ($a[1] !== $b[1]) return $a[1] <=> $b[1];
        return $a[2] <=> $b[2];
    }

    private function normalizeToken(string $s): string
    {
        $s = strtoupper($s);
        $s = preg_replace('/\s+/', '', $s);
        $s = preg_replace('/[^A-Z0-9\-]/', '', $s);
        $s = preg_replace('/\-+/', '-', $s);
        $s = trim($s, '-');

        if ($s === '') return '';

        $plain = str_replace('-', '', $s);
        if (strlen($plain) < 2) return '';

        return $s;
    }

    private function detectVehicleBox($res, int $imgW, int $imgH): ?array
    {
        $objs = $res->getLocalizedObjectAnnotations();
        if (!$objs || $imgW <= 0 || $imgH <= 0) return null;

        $best = null;
        $bestArea = 0;

        foreach ($objs as $obj) {
            $name = strtoupper((string)$obj->getName());
            if (!in_array($name, ['VEHICLE', 'CAR', 'TRUCK', 'VAN', 'SUV'], true)) continue;

            $poly = $obj->getBoundingPoly();
            if (!$poly || !$poly->getNormalizedVertices()) continue;

            $box = $this->normPolyToBox($poly->getNormalizedVertices(), $imgW, $imgH);
            $area = $this->boxArea($box);

            if ($area > $bestArea) {
                $bestArea = $area;
                $best = $box;
            }
        }

        return $best;
    }

    private function plateZoneBox(?array $vehicleBox, int $imgW, int $imgH): array
    {
        $ref = $vehicleBox ?: ['x1' => 0, 'y1' => 0, 'x2' => $imgW, 'y2' => $imgH];

        $vx1 = $ref['x1'];
        $vy1 = $ref['y1'];
        $vx2 = $ref['x2'];
        $vy2 = $ref['y2'];
        $vw = max(1, $vx2 - $vx1);
        $vh = max(1, $vy2 - $vy1);

        return [
            'x1' => (int)($vx1 + $vw * 0.18),
            'y1' => (int)($vy1 + $vh * 0.68),
            'x2' => (int)($vx1 + $vw * 0.82),
            'y2' => (int)($vy1 + $vh * 0.98),
        ];
    }

    private function centerInside(array $box, array $zone): bool
    {
        $cx = ($box['x1'] + $box['x2']) / 2;
        $cy = ($box['y1'] + $box['y2']) / 2;

        return $cx >= $zone['x1'] && $cx <= $zone['x2'] && $cy >= $zone['y1'] && $cy <= $zone['y2'];
    }

    private function boxArea(array $b): int
    {
        return max(0, ($b['x2'] - $b['x1'])) * max(0, ($b['y2'] - $b['y1']));
    }

    private function absPolyToBox($vertices): array
    {
        $xs = [];
        $ys = [];

        foreach ($vertices as $v) {
            $x = $v->getX();
            $y = $v->getY();
            if ($x === null || $y === null) continue;
            $xs[] = (int)$x;
            $ys[] = (int)$y;
        }

        if (!$xs || !$ys) return ['x1' => 0, 'y1' => 0, 'x2' => 0, 'y2' => 0];

        return [
            'x1' => min($xs),
            'y1' => min($ys),
            'x2' => max($xs),
            'y2' => max($ys),
        ];
    }

    private function normPolyToBox($normVertices, int $imgW, int $imgH): array
    {
        $xs = [];
        $ys = [];

        foreach ($normVertices as $v) {
            $x = $v->getX();
            $y = $v->getY();
            if ($x === null || $y === null) continue;

            $xs[] = (float)$x * $imgW;
            $ys[] = (float)$y * $imgH;
        }

        if (!$xs || !$ys) return ['x1' => 0, 'y1' => 0, 'x2' => $imgW, 'y2' => $imgH];

        return [
            'x1' => (int)min($xs),
            'y1' => (int)min($ys),
            'x2' => (int)max($xs),
            'y2' => (int)max($ys),
        ];
    }

    private function isAllowedUploadMime(string $mimeType, string $clientMime, string $extension): bool
    {
        $allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif',
            'image/heic-sequence',
            'image/heif-sequence',
        ];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

        foreach ([$mimeType, $clientMime] as $mime) {
            if ($mime === '') continue;
            if (str_starts_with($mime, 'image/')) return true;
            if ($mime === 'application/octet-stream') continue;
            if (in_array($mime, $allowedMimes, true)) return true;
        }

        if ($extension !== '' && in_array($extension, $allowedExtensions, true)) {
            return true;
        }

        return false;
    }

    private function inferImageBoundsFromTextAnnotations($textAnn): ?array
    {
        if (!$textAnn || count($textAnn) < 2) return null;

        $maxX = 0;
        $maxY = 0;

        for ($i = 1; $i < count($textAnn); $i++) {
            $poly = $textAnn[$i]->getBoundingPoly();
            if (!$poly || !$poly->getVertices()) continue;

            $box = $this->absPolyToBox($poly->getVertices());
            $maxX = max($maxX, (int)$box['x2']);
            $maxY = max($maxY, (int)$box['y2']);
        }

        if ($maxX <= 0 || $maxY <= 0) {
            return null;
        }

        return ['x1' => 0, 'y1' => 0, 'x2' => $maxX, 'y2' => $maxY];
    }

    private function pickPlateFromFullText(string $fullText): string
    {
        if ($fullText === '') return '';

        preg_match_all('/[A-Z0-9\-]{4,10}/', strtoupper($fullText), $matches);
        $tokens = $matches[0] ?? [];

        if (!$tokens) return '';

        $best = '';
        $bestScore = PHP_INT_MAX;

        foreach ($tokens as $token) {
            $norm = $this->normalizeToken($token);
            if ($norm === '') continue;

            $plain = str_replace('-', '', $norm);
            if (strlen($plain) < 4 || strlen($plain) > 10) continue;
            if (!preg_match('/[A-Z]/', $plain)) continue;
            if (!preg_match('/\d/', $plain)) continue;

            $score = abs(7 - strlen($plain));
            if ($score < $bestScore) {
                $best = $norm;
                $bestScore = $score;
            }
        }

        return $best;
    }
}
