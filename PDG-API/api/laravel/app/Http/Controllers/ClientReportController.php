<?php

namespace App\Http\Controllers;

use App\Traits\RestrictsCompanyAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClientReportController extends Controller
{
    use RestrictsCompanyAccess;

    private const FILTER_RULES = [
        'company_id' => ['sometimes', 'integer', 'exists:companies,id'],
        'date_from'  => ['sometimes', 'date_format:Y-m-d'],
        'date_to'    => ['sometimes', 'date_format:Y-m-d'],
        'per_page'   => ['sometimes', 'integer'],
        'page'       => ['sometimes', 'integer'],
    ];

    // GET /api/reports/client
    public function index(Request $request)
    {
        $validated = $request->validate(self::FILTER_RULES);
        $user = $request->user();

        if (!empty($validated['company_id']) && !$this->ensureCompanyAllowed($user, $validated['company_id'])) {
            return response()->json(['message' => 'Company not allowed.'], 403);
        }

        $query = DB::table('service_logs')
            ->join('companies', 'service_logs.company_id', '=', 'companies.id')
            ->join('services', 'service_logs.service_id', '=', 'services.id')
            ->leftJoin('departments as log_dept', 'log_dept.id', '=', 'service_logs.department_id')
            ->leftJoin('departments as svc_dept', 'svc_dept.id', '=', 'services.department_id');

        $this->applyCompanyRestriction($query, $user, 'service_logs.company_id');

        if (!empty($validated['company_id'])) {
            $query->where('service_logs.company_id', $validated['company_id']);
        }

        if (!empty($validated['date_from'])) {
            $query->whereDate('service_logs.performed_at', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('service_logs.performed_at', '<=', $validated['date_to']);
        }

        $query->select([
            'services.value as price',
            'services.type as service_name',
            'service_logs.stock_number',
            'service_logs.car_plate as plate',
            'companies.display_name as store',
            DB::raw('COALESCE(log_dept.name, svc_dept.name) as department'),
        ])->orderByDesc('service_logs.performed_at');

        $perPage = min((int) $request->input('per_page', 50), 200);

        return response()->json($query->paginate($perPage));
    }
}
