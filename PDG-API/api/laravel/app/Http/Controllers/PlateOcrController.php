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
            $http->validate(['image' => 'required|image|max:10240']);

            $imageContent = $http->file('image')->get();

            $client = new ImageAnnotatorClient([
                'transport' => 'rest',
            ]);

            $img  = (new Image())->setContent($imageContent);
            $feat = (new Feature())->setType(Feature\Type::TEXT_DETECTION);
            $ctx  = (new ImageContext())->setLanguageHints([env('GCV_LOCALE_HINT', 'en')]);

            $annotReq = (new AnnotateImageRequest())
                ->setImage($img)
                ->setFeatures([$feat])
                ->setImageContext($ctx);

            // >>> AQUI ESTÁ A DIFERENÇA: construir o BatchAnnotateImagesRequest
            $batchReq = (new BatchAnnotateImagesRequest())->setRequests([$annotReq]);

            $batchRes = $client->batchAnnotateImages($batchReq);
            $client->close();

            $responses = $batchRes->getResponses();
            if (empty($responses) || $responses[0]->hasError()) {
                Log::info('Vision sem texto ou com erro.');
                return response()->json(['plate' => '', 'score' => 0], Response::HTTP_OK);
            }

            // Para TEXT_DETECTION, use getTextAnnotations(); [0] contém o texto completo
            $textAnn = $responses[0]->getTextAnnotations();
            if (empty($textAnn)) {
                return response()->json(['plate' => '', 'score' => 0], Response::HTTP_OK);
            }

            $fullText = (string)($textAnn[0]->getDescription() ?? '');
            $lines = preg_split("/\r\n|\n|\r/", $fullText);

            $best = '';
            $bestScore = -1;

            foreach ($lines as $line) {
                $raw = strtoupper(preg_replace('/[^A-Z0-9]/', '', $line));
                if ($raw === '') continue;

                $fixed = $this->coerceToKnownFormats($raw);
                $len = strlen($fixed);
                if ($len < 5 || $len > 10) continue;

                $score = 0;
                if (preg_match('/^[0-9][A-Z]{2}[0-9][A-Z]{2}$/', $fixed)) $score = 120;
                elseif (preg_match('/^[A-Z]{3}[0-9]{3}$/', $fixed))      $score = 100;
                elseif (preg_match('/^[A-Z]{2,4}[0-9]{2,4}$/', $fixed))  $score = 80;
                elseif (preg_match('/^[A-Z0-9]{5,8}$/', $fixed))         $score = 40;

                if ($score > $bestScore || ($score === $bestScore && $len > strlen($best))) {
                    $best = $fixed;
                    $bestScore = $score;
                }
            }

            return response()->json([
                'plate' => $best,
                'score' => max(0, $bestScore),
                'debug_raw_google' => $fullText,
            ], Response::HTTP_OK);
        } catch (\Throwable $e) {
            Log::error('OCR error: ' . $e->getMessage(), ['file' => $e->getFile(), 'line' => $e->getLine()]);
            return response()->json(['error' => 'internal_error', 'message' => $e->getMessage()], 500);
        }
    }

    private function coerceToKnownFormats(string $s): string
    {
        if (strlen($s) === 7) return $s;
        $s = strtoupper($s);
        $raw = $s;
        if (strlen($s) !== 6) return $s;

        $templates = [
            [0 => 'D', 1 => 'L', 2 => 'L', 3 => 'D', 4 => 'L', 5 => 'L'],
            [0 => 'L', 1 => 'L', 2 => 'L', 3 => 'D', 4 => 'D', 5 => 'D'],
        ];
        $toDigit  = ['O' => '0', 'Q' => '0', 'D' => '0', 'I' => '1', 'L' => '1', 'Z' => '2', 'S' => '5', 'G' => '6', 'B' => '8', 'T' => '7', 'M' => '6'];
        $toLetter = ['0' => 'O', '1' => 'I', '2' => 'Z', '3' => 'B', '4' => 'A', '5' => 'S', '6' => 'G', '7' => 'T', '8' => 'B', '9' => 'G'];

        $best = $s;
        $bestCost = PHP_INT_MAX;
        foreach ($templates as $tpl) {
            $out = str_split($s);
            $cost = 0;
            for ($i = 0; $i < 6; $i++) {
                $want = $tpl[$i];
                $ch = $out[$i];
                if ($want === 'D') {
                    if (!ctype_digit($ch)) {
                        $out[$i] = $toDigit[$ch] ?? '0';
                        $cost += isset($toDigit[$ch]) ? 1 : 2;
                    }
                } else {
                    if (!ctype_alpha($ch)) {
                        $out[$i] = $toLetter[$ch] ?? 'A';
                        $cost += isset($toLetter[$ch]) ? 1 : 2;
                    }
                    if (in_array($raw[$i] ?? '', ['I', '1'], true) && $out[$i] === 'L') $out[$i] = 'I';
                }
                if (($raw[$i] ?? '') !== $out[$i]) $cost += 0.5;
            }
            $cand = implode('', $out);
            if ($cost < $bestCost) {
                $best = $cand;
                $bestCost = $cost;
            }
        }
        return $best;
    }
}
