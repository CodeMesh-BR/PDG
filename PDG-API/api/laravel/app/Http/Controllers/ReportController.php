<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // GET /api/reports/services
    public function services(Request $request)
{
    $validated = $request->validate([
        'company_id' => ['sometimes', 'integer', 'exists:companies,id'],
        'user_id'    => ['sometimes', 'integer', 'exists:users,id'],
        'plate'      => ['sometimes', 'string', 'max:20'],
        'date_from'  => ['sometimes', 'date_format:Y-m-d'],
        'date_to'    => ['sometimes', 'date_format:Y-m-d'],
        'date'       => ['sometimes', 'date_format:Y-m-d'],
    ]);

    // atalho: se mandou ?date=YYYY-MM-DD aplica nos dois
    if (!empty($validated['date']) && empty($validated['date_from']) && empty($validated['date_to'])) {
        $validated['date_from'] = $validated['date'];
        $validated['date_to']   = $validated['date'];
    }

    $base = DB::table('service_logs')
        ->join('companies', 'service_logs.company_id', '=', 'companies.id')
        ->join('users', 'service_logs.user_id', '=', 'users.id')
        ->join('services', 'service_logs.service_id', '=', 'services.id');

    if (!empty($validated['company_id'])) {
        $base->where('service_logs.company_id', $validated['company_id']);
    }

    if (!empty($validated['user_id'])) {
        $base->where('service_logs.user_id', $validated['user_id']);
    }

    if (!empty($validated['plate'])) {
        $base->where('service_logs.car_plate', 'like', '%' . $validated['plate'] . '%');
    }

    if (!empty($validated['date_from'])) {
        $base->whereDate('service_logs.performed_at', '>=', $validated['date_from']);
    }

    if (!empty($validated['date_to'])) {
        $base->whereDate('service_logs.performed_at', '<=', $validated['date_to']);
    }

    /* -----------------------------
       GRAND TOTALS
    ------------------------------*/
    $grand = (clone $base)
        ->selectRaw('
            COALESCE(SUM(service_logs.quantity), 0) as total_quantity,
            COALESCE(SUM(service_logs.quantity * services.value), 0) as total_amount,
            COALESCE(SUM(service_logs.quantity * COALESCE(services.cost_value, services.value)), 0) as total_cost_amount
        ')
        ->first();

    /* -----------------------------
       QUERY PRINCIPAL DO RELATÓRIO
       (AGORA COM CAR_PLATE)
    ------------------------------*/
    $query = (clone $base)
        ->selectRaw("
            service_logs.company_id,
            companies.name as company_name,
            service_logs.user_id,
            users.display_name,
            users.full_name,
            service_logs.service_id,
            services.type as service_type,
            services.description as service_description,
            services.value as service_unit_value,
            COALESCE(services.cost_value, services.value) as service_unit_cost_value,
            service_logs.car_plate,
            service_logs.performed_at,
            SUM(service_logs.quantity) as total_quantity,
            SUM(service_logs.quantity * services.value) as total_amount,
            SUM(service_logs.quantity * COALESCE(services.cost_value, services.value)) as total_cost_amount
        ")
        ->groupBy(
            'service_logs.company_id',
            'companies.name',
            'service_logs.user_id',
            'users.display_name',
            'users.full_name',
            'service_logs.service_id',
            'services.type',
            'services.description',
            'services.value',
            'services.cost_value',
            'service_logs.car_plate',
            'service_logs.performed_at'
        )
        ->orderByDesc('service_logs.performed_at')
        ->orderBy('companies.name')
        ->orderBy('users.display_name')
        ->orderBy('services.type');

    /* -----------------------------
       PAGINAÇÃO
    ------------------------------*/
    $perPage = min((int)$request->input('per_page', 50), 200);
    $rows = $query->paginate($perPage);

    /* -----------------------------
       PAYLOAD FINAL
    ------------------------------*/
    $payload = $rows->toArray();
    $payload['grand_totals'] = [
        'total_quantity' => (int) ($grand->total_quantity ?? 0),
        'total_amount'   => (float) ($grand->total_amount ?? 0),
        'total_cost_amount'   => (float) ($grand->total_cost_amount ?? 0),
    ];

    return response()->json($payload);
}


    // GET /api/reports/services/summary
    public function servicesSummary(Request $request)
    {
        $validated = $request->validate([
            'company_id' => ['sometimes', 'integer', 'exists:companies,id'],
            'user_id'    => ['sometimes', 'integer', 'exists:users,id'],
            'plate'      => ['sometimes', 'string', 'max:20'],
            'date_from'  => ['sometimes', 'date_format:Y-m-d'],
            'date_to'    => ['sometimes', 'date_format:Y-m-d'],
            'date'       => ['sometimes', 'date_format:Y-m-d'],
        ]);

        if (!empty($validated['date']) && empty($validated['date_from']) && empty($validated['date_to'])) {
            $validated['date_from'] = $validated['date'];
            $validated['date_to']   = $validated['date'];
        }

        $base = DB::table('service_logs')
            ->join('companies', 'service_logs.company_id', '=', 'companies.id')
            ->join('users', 'service_logs.user_id', '=', 'users.id')
            ->join('services', 'service_logs.service_id', '=', 'services.id');

        if (!empty($validated['company_id'])) {
            $base->where('service_logs.company_id', $validated['company_id']);
        }

        if (!empty($validated['user_id'])) {
            $base->where('service_logs.user_id', $validated['user_id']);
        }

        if (!empty($validated['plate'])) {
            $base->where('service_logs.car_plate', 'like', '%' . $validated['plate'] . '%');
        }

        if (!empty($validated['date_from'])) {
            $base->whereDate('service_logs.performed_at', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $base->whereDate('service_logs.performed_at', '<=', $validated['date_to']);
        }

        $totalsByCompany = (clone $base)
            ->selectRaw("
                service_logs.company_id,
                companies.name as company_name,
                SUM(service_logs.quantity) as total_quantity,
                SUM(service_logs.quantity * services.value) as total_amount
            ")
            ->groupBy('service_logs.company_id', 'companies.name')
            ->orderBy('companies.name')
            ->get();

        $totalsByUser = (clone $base)
            ->selectRaw("
                service_logs.user_id,
                users.display_name,
                users.full_name,
                SUM(service_logs.quantity) as total_quantity,
                SUM(service_logs.quantity * services.value) as total_amount
            ")
            ->groupBy('service_logs.user_id', 'users.display_name', 'users.full_name')
            ->orderBy('users.display_name')
            ->get();

        $grand = (clone $base)
            ->selectRaw('
                COALESCE(SUM(service_logs.quantity), 0) as total_quantity,
                COALESCE(SUM(service_logs.quantity * services.value), 0) as total_amount
            ')
            ->first();

        return response()->json([
            'totals_by_company' => $totalsByCompany,
            'totals_by_user'    => $totalsByUser,
            'grand_totals'      => [
                'total_quantity' => (int) ($grand->total_quantity ?? 0),
                'total_amount'   => (float) ($grand->total_amount ?? 0),
            ],
        ]);
    }
}
