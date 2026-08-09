<?php

namespace App\Http\Controllers;

use App\Traits\RestrictsCompanyAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    use RestrictsCompanyAccess;

    private const FILTER_RULES = [
        'company_id' => ['sometimes', 'integer', 'exists:companies,id'],
        'user_id'    => ['sometimes', 'integer', 'exists:users,id'],
        'plate'      => ['sometimes', 'string', 'max:20'],
        'date_from'  => ['sometimes', 'date_format:Y-m-d'],
        'date_to'    => ['sometimes', 'date_format:Y-m-d'],
        'date'       => ['sometimes', 'date_format:Y-m-d'],
    ];

    /**
     * Monta a query base (joins + filtros + restrição por empresa) usada por
     * todos os relatórios. Retorna null quando o usuário não pode ver a empresa
     * pedida — nesse caso o controller responde 403.
     */
    private function buildBaseQuery(Request $request, array $validated)
    {
        $user = $request->user();

        if (!empty($validated['company_id']) && !$this->ensureCompanyAllowed($user, $validated['company_id'])) {
            return null;
        }

        // atalho: se mandou ?date=YYYY-MM-DD aplica nos dois
        if (!empty($validated['date']) && empty($validated['date_from']) && empty($validated['date_to'])) {
            $validated['date_from'] = $validated['date'];
            $validated['date_to']   = $validated['date'];
        }

        $base = DB::table('service_logs')
            ->join('companies', 'service_logs.company_id', '=', 'companies.id')
            ->join('users', 'service_logs.user_id', '=', 'users.id')
            ->join('services', 'service_logs.service_id', '=', 'services.id')
            // o departamento pode estar gravado no lançamento (mais específico)
            // ou vir do catálogo do serviço — usamos o primeiro que existir.
            ->leftJoin('departments as log_dept', 'log_dept.id', '=', 'service_logs.department_id')
            ->leftJoin('departments as svc_dept', 'svc_dept.id', '=', 'services.department_id');

        $this->applyCompanyRestriction($base, $user, 'service_logs.company_id');

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

        return $base;
    }

    /** Expressão de receita/custo reutilizada pelos agregados. */
    private function amountSelect(bool $showCosts, string $prefix = ''): string
    {
        $sql = "
            SUM(service_logs.quantity) as {$prefix}total_quantity,
            SUM(service_logs.quantity * services.value) as {$prefix}total_amount
        ";

        if ($showCosts) {
            $sql .= ", SUM(service_logs.quantity * COALESCE(services.cost_value, services.value)) as {$prefix}total_cost_amount";
        }

        return $sql;
    }

    // GET /api/reports/services
    public function services(Request $request)
    {
        $validated = $request->validate(self::FILTER_RULES);

        $base = $this->buildBaseQuery($request, $validated);

        if ($base === null) {
            return response()->json([
                'message' => 'You are not allowed to view reports for this company.',
            ], 403);
        }

        $showCosts = $request->user()->canSeeCosts();

        /* -----------------------------
           GRAND TOTALS
        ------------------------------*/
        $grand = (clone $base)
            ->selectRaw('
                COALESCE(SUM(service_logs.quantity), 0) as total_quantity,
                COALESCE(SUM(service_logs.quantity * services.value), 0) as total_amount
                ' . ($showCosts
                    ? ', COALESCE(SUM(service_logs.quantity * COALESCE(services.cost_value, services.value)), 0) as total_cost_amount'
                    : '') . '
            ')
            ->first();

        /* -----------------------------
           QUERY PRINCIPAL DO RELATÓRIO
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
                " . ($showCosts
                    ? 'COALESCE(services.cost_value, services.value) as service_unit_cost_value,'
                    : '') . "
                COALESCE(log_dept.name, svc_dept.name) as department_name,
                service_logs.car_plate,
                service_logs.vehicle_condition,
                service_logs.stock_number,
                service_logs.notes,
                service_logs.performed_at,
                " . $this->amountSelect($showCosts) . "
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
                'log_dept.name',
                'svc_dept.name',
                'service_logs.car_plate',
                'service_logs.vehicle_condition',
                'service_logs.stock_number',
                'service_logs.notes',
                'service_logs.performed_at'
            )
            ->orderByDesc('service_logs.performed_at')
            ->orderBy('companies.name')
            ->orderBy('users.display_name')
            ->orderBy('services.type');

        /* -----------------------------
           PAGINAÇÃO
        ------------------------------*/
        $perPage = min((int) $request->input('per_page', 50), 200);
        $rows = $query->paginate($perPage);

        /* -----------------------------
           PAYLOAD FINAL
        ------------------------------*/
        $payload = $rows->toArray();
        $payload['grand_totals'] = [
            'total_quantity' => (int) ($grand->total_quantity ?? 0),
            'total_amount'   => (float) ($grand->total_amount ?? 0),
        ];

        if ($showCosts) {
            $payload['grand_totals']['total_cost_amount'] = (float) ($grand->total_cost_amount ?? 0);
        }

        $payload['can_see_costs'] = $showCosts;

        return response()->json($payload);
    }

    // GET /api/reports/services/summary
    public function servicesSummary(Request $request)
    {
        $validated = $request->validate(self::FILTER_RULES);

        $base = $this->buildBaseQuery($request, $validated);

        if ($base === null) {
            return response()->json([
                'message' => 'You are not allowed to view reports for this company.',
            ], 403);
        }

        $showCosts = $request->user()->canSeeCosts();
        $amounts   = $this->amountSelect($showCosts);

        $totalsByCompany = (clone $base)
            ->selectRaw("
                service_logs.company_id,
                companies.name as company_name,
                {$amounts}
            ")
            ->groupBy('service_logs.company_id', 'companies.name')
            ->orderByDesc('total_amount')
            ->get();

        $totalsByUser = (clone $base)
            ->selectRaw("
                service_logs.user_id,
                users.display_name,
                users.full_name,
                {$amounts}
            ")
            ->groupBy('service_logs.user_id', 'users.display_name', 'users.full_name')
            ->orderByDesc('total_amount')
            ->get();

        $totalsByService = (clone $base)
            ->selectRaw("
                service_logs.service_id,
                services.type as service_type,
                services.description as service_description,
                {$amounts}
            ")
            ->groupBy('service_logs.service_id', 'services.type', 'services.description')
            ->orderByDesc('total_amount')
            ->get();

        $totalsByDepartment = (clone $base)
            ->selectRaw("
                COALESCE(log_dept.name, svc_dept.name) as department_name,
                {$amounts}
            ")
            ->groupBy('log_dept.name', 'svc_dept.name')
            ->orderByDesc('total_amount')
            ->get();

        $totalsByDay = (clone $base)
            ->selectRaw("
                service_logs.performed_at,
                {$amounts}
            ")
            ->groupBy('service_logs.performed_at')
            ->orderBy('service_logs.performed_at')
            ->get();

        $totalsByCondition = (clone $base)
            ->selectRaw("
                service_logs.vehicle_condition,
                {$amounts}
            ")
            ->groupBy('service_logs.vehicle_condition')
            ->orderByDesc('total_amount')
            ->get();

        $grand = (clone $base)
            ->selectRaw('
                COALESCE(SUM(service_logs.quantity), 0) as total_quantity,
                COALESCE(SUM(service_logs.quantity * services.value), 0) as total_amount,
                COUNT(*) as total_entries,
                COUNT(DISTINCT service_logs.car_plate) as distinct_vehicles,
                COUNT(DISTINCT service_logs.performed_at) as days_worked
                ' . ($showCosts
                    ? ', COALESCE(SUM(service_logs.quantity * COALESCE(services.cost_value, services.value)), 0) as total_cost_amount'
                    : '') . '
            ')
            ->first();

        $totalAmount       = (float) ($grand->total_amount ?? 0);
        $distinctVehicles  = (int) ($grand->distinct_vehicles ?? 0);
        $daysWorked        = (int) ($grand->days_worked ?? 0);

        $grandTotals = [
            'total_quantity'     => (int) ($grand->total_quantity ?? 0),
            'total_amount'       => $totalAmount,
            'total_entries'      => (int) ($grand->total_entries ?? 0),
            'distinct_vehicles'  => $distinctVehicles,
            'days_worked'        => $daysWorked,
            // ticket médio por veículo atendido, não por lançamento
            'average_ticket'     => $distinctVehicles > 0 ? round($totalAmount / $distinctVehicles, 2) : 0.0,
            'average_per_day'    => $daysWorked > 0 ? round($totalAmount / $daysWorked, 2) : 0.0,
        ];

        if ($showCosts) {
            $totalCost = (float) ($grand->total_cost_amount ?? 0);
            $grandTotals['total_cost_amount'] = $totalCost;
            $grandTotals['total_margin']      = round($totalAmount - $totalCost, 2);
            $grandTotals['margin_percent']    = $totalAmount > 0
                ? round((($totalAmount - $totalCost) / $totalAmount) * 100, 2)
                : 0.0;
        }

        return response()->json([
            'totals_by_company'    => $totalsByCompany,
            'totals_by_user'       => $totalsByUser,
            'totals_by_service'    => $totalsByService,
            'totals_by_department' => $totalsByDepartment,
            'totals_by_day'        => $totalsByDay,
            'totals_by_condition'  => $totalsByCondition,
            'grand_totals'         => $grandTotals,
            'can_see_costs'        => $showCosts,
        ]);
    }
}
