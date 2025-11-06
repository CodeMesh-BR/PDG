<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class ServiceController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'        => ['required', 'string', 'min:2', 'max:150'],
            'description' => ['required', 'string', 'min:2', 'max:500'],
            'value'       => ['required', 'decimal:0,2'],
        ]);

        try {
            $service = Service::create([
                'type'        => $validated['type'],
                'description' => $validated['description'],
                'value'       => $validated['value'],
            ]);

            return response()->json([
                'message' => 'Service created successfully.',
                'service' => $service,
            ], 201);
        } catch (QueryException $e) {
            if ($e->getCode() === '23505') {
                return response()->json(['message' => 'Duplicate entry.'], 409);
            }
            throw $e;
        }
    }

    // GET /api/services
    public function index()
    {
        return response()->json(
            \App\Models\Service::query()
                ->select('id', 'type', 'description', 'value', 'created_at', 'updated_at')
                ->orderByDesc('id')
                ->paginate(15)
        );
    }


    // GET /api/services/{service}
    public function show(Service $service)
    {
        return response()->json([
            'data' => [
                'id'                => $service->id,
                'type'              => $service->type,
                'description'       => $service->description,
                'value'             => $service->value,
                'created_at'        => $service->created_at,
                'updated_at'        => $service->updated_at,
            ],
        ]);
    }

    // DELETE /api/services/{service}
    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json([
            'message' => 'Service deleted successfully.',
            'data'    => [
                'id'  => $service->id,
            ]
        ], 204);
    }
}
