<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\ServiceLog;
use Illuminate\Http\Request;

class ServiceLogController extends Controller
{
    // POST /api/service-logs
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'company_id'  => ['required', 'integer', 'exists:companies,id'],
            'service_id'  => ['required', 'integer', 'exists:services,id'],

            // placa obrigatória
            'car_plate'   => ['required', 'string', 'max:20'],

            'date'        => ['required', 'date_format:Y-m-d'],
            'quantity'    => ['sometimes', 'integer', 'min:1'],
            'notes'       => ['sometimes', 'string', 'max:1000'],

            // permite confirmar duplicados
            'force'       => ['sometimes', 'boolean'],
        ]);

        // valida se o serviço pertence à empresa
        $company = Company::with('services:id')->findOrFail($validated['company_id']);
        $allowedServiceIds = $company->services->pluck('id')->all();

        if (!in_array($validated['service_id'], $allowedServiceIds, true)) {
            return response()->json([
                'message' => 'This service is not attached to the selected company.',
            ], 422);
        }

        // BUSCA DUPLICADOS
        $exists = \App\Models\ServiceLog::where('company_id', $validated['company_id'])
            ->where('service_id', $validated['service_id'])
            ->where('car_plate', strtoupper($validated['car_plate']))
            ->whereDate('performed_at', $validated['date'])
            ->exists();

        // Se já existe e não veio força, avisa
        if ($exists && empty($validated['force'])) {
            return response()->json([
                'message' => 'A service entry for this car, service and date already exists.',
                'needs_confirmation' => true
            ], 409); // Conflict
        }

        // cria o lançamento
        $log = ServiceLog::create([
            'user_id'      => $user->id,
            'company_id'   => $validated['company_id'],
            'service_id'   => $validated['service_id'],
            'car_plate'    => strtoupper($validated['car_plate']),
            'performed_at' => $validated['date'],
            'quantity'     => $validated['quantity'] ?? 1,
            'notes'        => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Service entry created successfully.',
            'data'    => [
                'id'           => $log->id,
                'company_id'   => $log->company_id,
                'service_id'   => $log->service_id,
                'car_plate'    => $log->car_plate,
                'performed_at' => $log->performed_at->toDateString(),
                'quantity'     => $log->quantity,
                'notes'        => $log->notes,
            ],
        ], 201);
    }

    // GET /api/service-logs
    public function index(Request $request)
    {
        $user = $request->user();

        $logs = ServiceLog::with([
            'company:id,name,display_name',
            'service:id,type,description,value',
        ])
            ->where('user_id', $user->id)
            ->when(
                $request->filled('company_id'),
                fn($q) =>
                $q->where('company_id', $request->integer('company_id'))
            )
            ->when(
                $request->filled('date'),
                fn($q) =>
                $q->whereDate('performed_at', $request->input('date'))
            )
            ->orderByDesc('performed_at')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($logs);
    }

    // DELETE /api/service-logs/{service_log}
    public function destroy(ServiceLog $serviceLog)
    {
        $serviceLog->delete();
        return response()->json([
            'message' => 'ServiceLog deleted successfully.',
            'data'    => [
                'id'  => $serviceLog->id,
            ]
        ], 204);
    }
}
