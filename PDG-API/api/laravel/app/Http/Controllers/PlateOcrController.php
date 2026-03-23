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

            $imageContent = file_get_contents($image->getRealPath());
            $imageSize = $image->getSize() ?: strlen($imageContent);

            $size = @getimagesizefromstring($imageContent);
            $imgW = (int)($size[0] ?? 0);
            $imgH = (int)($size[1] ?? 0);

            if (!$this->isAllowedUploadMime($mimeType, $clientMime, $extension) && ($imgW <= 0 || $imgH <= 0)) {
                return response()->json([
                    'plate' => '',
                    'score' => 0,
                    'error' => 'unsupported_image_type',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $maxDimension = 2048;
            $shouldResizeBySize = $imageSize > 5 * 1024 * 1024;
            $shouldResizeByDimension = $imgW > $maxDimension || $imgH > $maxDimension;

            if (($shouldResizeBySize || $shouldResizeByDimension) && function_exists('imagecreatefromstring')) {
                Log::info('OCR image needs resize before Vision', [
                    'original_size' => $imageSize,
                    'original_width' => $imgW,
                    'original_height' => $imgH,
                    'resize_by_size' => $shouldResizeBySize,
                    'resize_by_dimension' => $shouldResizeByDimension,
                ]);

                $srcImage = @imagecreatefromstring($imageContent);
                if ($srcImage !== false && $imgW > 0 && $imgH > 0) {
                    $scale = min($maxDimension / $imgW, $maxDimension / $imgH, 1);
                    $newW = max(1, (int)round($imgW * $scale));
                    $newH = max(1, (int)round($imgH * $scale));

                    $resized = imagecreatetruecolor($newW, $newH);
                    imagecopyresampled($resized, $srcImage, 0, 0, 0, 0, $newW, $newH, $imgW, $imgH);

                    ob_start();
                    imagejpeg($resized, null, 82);
                    $jpegContent = ob_get_clean();

                    if ($jpegContent !== false) {
                        $imageContent = $jpegContent;
                        $imgW = $newW;
                        $imgH = $newH;
                    }

                    imagedestroy($resized);
                    imagedestroy($srcImage);
                } elseif ($srcImage !== false) {
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
        $lineTol = max(8, (int)round($zoneH * 0.075));

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

        $bestCandidate = '';
        $bestScore = PHP_INT_MIN;
        $bestArea = 0;

        foreach ($lines as $ln) {
            $lineTokens = $ln['tokens'];
            usort($lineTokens, fn($a, $b) => $a['cx'] <=> $b['cx']);

            $avgW = 0;
            foreach ($lineTokens as $t) $avgW += $t['w'];
            $avgW = $avgW / max(1, count($lineTokens));

            $candidates = $this->buildLineCandidates($lineTokens, $avgW);
            foreach ($candidates as $candidate) {
                $score = $this->scorePlateCandidate($candidate);
                if ($score < 0) continue;

                $lineArea = (int)($ln['sumArea'] ?? 0);
                if (
                    $score > $bestScore ||
                    ($score === $bestScore && $lineArea > $bestArea)
                ) {
                    $bestScore = $score;
                    $bestArea = $lineArea;
                    $bestCandidate = $candidate;
                }
            }
        }

        return $bestCandidate;
    }

    private function buildLineCandidates(array $lineTokens, float $avgW): array
    {
        if (!$lineTokens) return [];

        $rawCandidates = [];
        $count = count($lineTokens);
        $maxWindow = min(5, $count);

        for ($start = 0; $start < $count; $start++) {
            $joinedNoSep = '';
            $joinedGapAware = '';

            for ($end = $start; $end < $count && $end < $start + $maxWindow; $end++) {
                $tokenText = (string)($lineTokens[$end]['text'] ?? '');
                if ($tokenText === '') continue;

                if ($end === $start) {
                    $joinedNoSep = $tokenText;
                    $joinedGapAware = $tokenText;
                } else {
                    $prev = $lineTokens[$end - 1];
                    $gap = (int)$lineTokens[$end]['box']['x1'] - (int)$prev['box']['x2'];
                    $addDash = $gap > ($avgW * 0.35);

                    $joinedNoSep .= $tokenText;
                    $joinedGapAware .= ($addDash ? '-' : '') . $tokenText;
                }

                $rawCandidates[] = $joinedNoSep;
                $rawCandidates[] = $joinedGapAware;
            }
        }

        $unique = [];
        foreach ($rawCandidates as $raw) {
            $clean = $this->cleanPlateString($raw);
            if ($clean === '') continue;
            $unique[$clean] = true;
        }

        return array_keys($unique);
    }

    private function cleanPlateString(string $value): string
    {
        $value = strtoupper($value);
        $value = preg_replace('/[^A-Z0-9\-]/', '', $value);
        $value = preg_replace('/\-+/', '-', $value);
        $value = trim($value, '-');
        return $value;
    }

    private function scorePlateCandidate(string $candidate): int
    {
        $candidate = $this->cleanPlateString($candidate);
        if ($candidate === '') return -1;

        $plain = str_replace('-', '', $candidate);
        $len = strlen($plain);

        if ($len < 4 || $len > 10) return -1;
        if (!preg_match('/[A-Z]/', $plain) || !preg_match('/\d/', $plain)) return -1;

        $score = 0;
        $score += max(0, 10 - abs(7 - $len)) * 4;
        if ($len >= 5 && $len <= 8) $score += 12;
        if (str_contains($candidate, '-')) $score += 2;

        if (preg_match('/^(?:[A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2}|[A-Z]{2}\d{2}[A-Z]{2}|\d{2}[A-Z]{2}\d{2}|\d{2}\d{2}[A-Z]{2}|\d[A-Z]{3}\d{3}|\d{1,2}[A-Z]{2,3}\d{2,4})$/', $plain)) {
            $score += 40;
        } elseif (preg_match('/^[A-Z0-9]{5,8}$/', $plain)) {
            $score += 8;
        }

        if (preg_match('/(.)\1{4,}/', $plain)) {
            $score -= 20;
        }

        return $score;
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

        $text = strtoupper($fullText);
        $text = preg_replace('/[^A-Z0-9\-\s]/', ' ', $text);
        $text = preg_replace('/\s+/', ' ', trim($text));

        if ($text === '') return '';

        $rawCandidates = [];
        $patterns = [
            '/[A-Z]{3}\s*[- ]?\s*\d{4}/',
            '/[A-Z]{3}\s*[- ]?\s*\d\s*[- ]?\s*[A-Z]\s*[- ]?\s*\d{2}/',
            '/[A-Z]{2}\s*[- ]?\s*\d{2}\s*[- ]?\s*[A-Z]{2}/',
            '/\d{2}\s*[- ]?\s*[A-Z]{2}\s*[- ]?\s*\d{2}/',
            '/\d{2}\s*[- ]?\s*\d{2}\s*[- ]?\s*[A-Z]{2}/',
            '/\d\s*[- ]?\s*[A-Z]{3}\s*[- ]?\s*\d{3}/',
            '/\d{1,2}\s*[- ]?\s*[A-Z]{2,3}\s*[- ]?\s*\d{2,4}/',
        ];

        foreach ($patterns as $pattern) {
            preg_match_all($pattern, $text, $matches);
            foreach (($matches[0] ?? []) as $match) {
                $rawCandidates[] = $match;
            }
        }

        preg_match_all('/[A-Z0-9\-]{4,10}/', $text, $genericMatches);
        foreach (($genericMatches[0] ?? []) as $match) {
            $rawCandidates[] = $match;
        }

        preg_match_all('/[A-Z0-9]{1,10}/', $text, $splitMatches);
        $parts = $splitMatches[0] ?? [];
        $partsCount = count($parts);
        for ($start = 0; $start < $partsCount; $start++) {
            $noSep = '';
            $withSep = '';
            for ($end = $start; $end < $partsCount && $end < $start + 3; $end++) {
                $noSep .= $parts[$end];
                $withSep = $withSep === '' ? $parts[$end] : $withSep . '-' . $parts[$end];
                $rawCandidates[] = $noSep;
                $rawCandidates[] = $withSep;
            }
        }

        if (!$rawCandidates) return '';

        $best = '';
        $bestScore = PHP_INT_MIN;

        foreach ($rawCandidates as $rawCandidate) {
            $candidate = $this->cleanPlateString($rawCandidate);
            if ($candidate === '') continue;

            $score = $this->scorePlateCandidate($candidate);
            if ($score < 0) continue;

            if ($score > $bestScore) {
                $best = $candidate;
                $bestScore = $score;
            }
        }

        return $best;
    }
}
