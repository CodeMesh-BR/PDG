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
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'type'        => ['required', 'string', 'min:2', 'max:150'],
            'description' => ['required', 'string', 'min:2', 'max:500'],
            'value'       => ['required', 'decimal:0,2'],
            'cost_value'  => ['required', 'decimal:0,2'],
        ]);

        try {
            $service = Service::create([
                'department_id' => $validated['department_id'],
                'type'        => $validated['type'],
                'description' => $validated['description'],
                'value'       => $validated['value'],
                'cost_value'  => $validated['cost_value'],
            ]);

            $service->load('department:id,name,description,bill_by_unit,bill_by_hour,bill_by_quantity');

            return response()->json([
                'message' => 'Service created successfully.',
                'service' => $service,
                'data' => $service,
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
                ->with('department:id,name,description,bill_by_unit,bill_by_hour,bill_by_quantity')
                ->select('id', 'department_id', 'type', 'description', 'value', 'cost_value', 'created_at', 'updated_at')
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
                'department_id'     => $service->department_id,
                'department'        => $service->department,
                'type'              => $service->type,
                'description'       => $service->description,
                'value'             => $service->value,
                'cost_value'        => $service->cost_value,
                'created_at'        => $service->created_at,
                'updated_at'        => $service->updated_at,
            ],
        ]);
    }

    // PUT /api/services/{service}
    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'type'        => ['required', 'string', 'min:2', 'max:150'],
            'description' => ['required', 'string', 'min:2', 'max:500'],
            'value'       => ['required', 'decimal:0,2'],
            'cost_value'  => ['required', 'decimal:0,2'],
        ]);

        try {
            $service->update([
                'department_id' => $validated['department_id'],
                'type'        => $validated['type'],
                'description' => $validated['description'],
                'value'       => $validated['value'],
                'cost_value'  => $validated['cost_value'],
            ]);

            $service->load('department:id,name,description,bill_by_unit,bill_by_hour,bill_by_quantity');

            return response()->json([
                'message' => 'Service updated successfully.',
                'data'    => [
                    'id'          => $service->id,
                    'department_id' => $service->department_id,
                    'department' => $service->department,
                    'type'        => $service->type,
                    'description' => $service->description,
                    'value'       => $service->value,
                    'cost_value'  => $service->cost_value,
                    'created_at'  => $service->created_at,
                    'updated_at'  => $service->updated_at,
                ],
            ]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23505') {
                return response()->json(['message' => 'Duplicate entry.'], 409);
            }
            throw $e;
        }
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
