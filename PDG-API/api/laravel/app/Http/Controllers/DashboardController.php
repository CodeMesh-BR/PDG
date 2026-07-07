<?php

namespace App\Http\Controllers;

use App\Traits\RestrictsCompanyAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use RestrictsCompanyAccess;

    // GET /api/dashboard/overview
    public function overview(Request $request)
    {
        $user = $request->user();
        $today = now()->toDateString();

        /* -----------------------------
           KPIs DO DIA
        ------------------------------*/
        $todayStats = $this->applyCompanyRestriction(
            DB::table('service_logs')
                ->join('services', 'service_logs.service_id', '=', 'services.id')
                ->selectRaw('
                    COUNT(DISTINCT service_logs.car_plate) as cars,
                    COUNT(DISTINCT service_logs.company_id) as companies,
                    COALESCE(SUM(service_logs.quantity * services.value), 0) as revenue
                ')
                ->whereDate('service_logs.performed_at', $today),
            $user,
            'service_logs.company_id'
        )->first();

        /* -----------------------------
           ÚLTIMOS 7 DIAS (SEMANA)
        ------------------------------*/
        $week = $this->applyCompanyRestriction(
            DB::table('service_logs')
                ->selectRaw('
                    DATE(performed_at) as date,
                    COUNT(*) as services
                ')
                ->whereDate('performed_at', '>=', now()->subDays(6)->toDateString()),
            $user,
            'service_logs.company_id'
        )
            ->groupByRaw('DATE(performed_at)')
            ->orderBy('date')
            ->get();

        /* -----------------------------
           ÚLTIMOS 15 DIAS (QUINZENA)
        ------------------------------*/
        $fortnight = $this->applyCompanyRestriction(
            DB::table('service_logs')
                ->selectRaw('
                    DATE(performed_at) as date,
                    COUNT(*) as services
                ')
                ->whereDate('performed_at', '>=', now()->subDays(14)->toDateString()),
            $user,
            'service_logs.company_id'
        )
            ->groupByRaw('DATE(performed_at)')
            ->orderBy('date')
            ->get();

        return response()->json([
            'today' => [
                'cars'      => (int) ($todayStats->cars ?? 0),
                'companies' => (int) ($todayStats->companies ?? 0),
                'revenue'   => (float) ($todayStats->revenue ?? 0),
            ],
            'week'      => $week,
            'fortnight' => $fortnight,
        ]);
    }

    // GET /api/dashboard/today-by-company
    public function todayByCompany(Request $request)
    {
        $user = $request->user();
        $today = now()->toDateString();

        $rows = $this->applyCompanyRestriction(
            DB::table('service_logs')
                ->join('companies', 'service_logs.company_id', '=', 'companies.id')
                ->selectRaw('
                    service_logs.company_id,
                    companies.name as company_name,
                    COUNT(DISTINCT service_logs.car_plate) as cars
                ')
                ->whereDate('service_logs.performed_at', $today),
            $user,
            'service_logs.company_id'
        )
            ->groupBy('service_logs.company_id', 'companies.name')
            ->orderByDesc('cars')
            ->get();

        return response()->json($rows);
    }
}
