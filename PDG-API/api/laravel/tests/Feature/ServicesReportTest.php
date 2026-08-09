<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\Service;
use App\Models\ServiceLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServicesReportTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private Service $service;
    private Department $department;
    private User $detailer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->department = Department::create([
            'name'        => 'Detailing',
            'description' => 'Interior and exterior detailing',
        ]);

        $this->service = Service::factory()->create([
            'type'          => 'Full Detail',
            'description'   => 'Complete interior + exterior',
            'value'         => 100.00,
            'cost_value'    => 60.00,
            'department_id' => $this->department->id,
        ]);

        $this->company = Company::factory()->create([
            'name'               => 'Acme Motors',
            'default_service_id' => $this->service->id,
        ]);
        $this->company->services()->sync([$this->service->id]);

        $this->detailer = User::factory()->create(['role' => 'detailer']);
        $this->detailer->companies()->sync([$this->company->id]);

        ServiceLog::create([
            'user_id'           => $this->detailer->id,
            'company_id'        => $this->company->id,
            'service_id'        => $this->service->id,
            'department_id'     => $this->department->id,
            'car_plate'         => 'ABC1234',
            'vehicle_condition' => 'used',
            'stock_number'      => 'STK-001',
            'notes'             => 'Heavy pet hair',
            'performed_at'      => '2026-01-10',
            'quantity'          => 2,
        ]);

        ServiceLog::create([
            'user_id'           => $this->detailer->id,
            'company_id'        => $this->company->id,
            'service_id'        => $this->service->id,
            'department_id'     => $this->department->id,
            'car_plate'         => 'XYZ9876',
            'vehicle_condition' => 'new',
            'stock_number'      => 'STK-002',
            'performed_at'      => '2026-01-11',
            'quantity'          => 1,
        ]);
    }

    public function test_services_report_exposes_the_detailed_columns(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->getJson('/api/reports/services');

        $response->assertOk();

        $rows = collect($response->json('data'));
        $this->assertCount(2, $rows);

        $row = $rows->firstWhere('car_plate', 'ABC1234');

        $this->assertSame('Acme Motors', $row['company_name']);
        $this->assertSame('Full Detail', $row['service_type']);
        $this->assertSame('Detailing', $row['department_name']);
        $this->assertSame('used', $row['vehicle_condition']);
        $this->assertSame('STK-001', $row['stock_number']);
        $this->assertSame('Heavy pet hair', $row['notes']);
        $this->assertEquals(2, $row['total_quantity']);
        $this->assertEquals(200, $row['total_amount']);
        $this->assertEquals(120, $row['total_cost_amount']);

        // 2 * 100 + 1 * 100
        $this->assertEquals(300, $response->json('grand_totals.total_amount'));
        $this->assertEquals(180, $response->json('grand_totals.total_cost_amount'));
    }

    public function test_department_falls_back_to_the_service_catalog(): void
    {
        // lançamento sem department_id próprio: cai no departamento do serviço
        ServiceLog::create([
            'user_id'      => $this->detailer->id,
            'company_id'   => $this->company->id,
            'service_id'   => $this->service->id,
            'car_plate'    => 'NODEPT1',
            'performed_at' => '2026-01-12',
            'quantity'     => 1,
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $row = collect($this->getJson('/api/reports/services')->json('data'))
            ->firstWhere('car_plate', 'NODEPT1');

        $this->assertSame('Detailing', $row['department_name']);
    }

    public function test_supervisor_never_receives_cost_columns(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'supervisor']));

        $response = $this->getJson('/api/reports/services');

        $response->assertOk();
        $this->assertFalse($response->json('can_see_costs'));
        $this->assertArrayNotHasKey('total_cost_amount', $response->json('data.0'));
        $this->assertArrayNotHasKey('service_unit_cost_value', $response->json('data.0'));
        $this->assertArrayNotHasKey('total_cost_amount', $response->json('grand_totals'));
    }

    public function test_summary_returns_every_breakdown(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->getJson('/api/reports/services/summary');

        $response->assertOk();

        $response->assertJsonStructure([
            'totals_by_company',
            'totals_by_user',
            'totals_by_service',
            'totals_by_department',
            'totals_by_day',
            'totals_by_condition',
            'grand_totals' => [
                'total_quantity',
                'total_amount',
                'total_entries',
                'distinct_vehicles',
                'days_worked',
                'average_ticket',
                'average_per_day',
                'total_cost_amount',
                'total_margin',
                'margin_percent',
            ],
            'can_see_costs',
        ]);

        $totals = $response->json('grand_totals');

        $this->assertEquals(3, $totals['total_quantity']);
        $this->assertEquals(300, $totals['total_amount']);
        $this->assertEquals(2, $totals['distinct_vehicles']);
        $this->assertEquals(2, $totals['days_worked']);
        $this->assertEquals(150, $totals['average_ticket']);   // 300 / 2 veículos
        $this->assertEquals(150, $totals['average_per_day']);  // 300 / 2 dias
        $this->assertEquals(120, $totals['total_margin']);     // 300 - 180
        $this->assertEquals(40, $totals['margin_percent']);

        $this->assertCount(2, $response->json('totals_by_day'));
        $this->assertCount(2, $response->json('totals_by_condition'));
        $this->assertSame('Detailing', $response->json('totals_by_department.0.department_name'));
    }

    public function test_summary_hides_costs_from_supervisors(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'supervisor']));

        $totals = $this->getJson('/api/reports/services/summary')->json('grand_totals');

        $this->assertArrayNotHasKey('total_cost_amount', $totals);
        $this->assertArrayNotHasKey('total_margin', $totals);
        $this->assertArrayNotHasKey('margin_percent', $totals);
    }

    public function test_filters_still_apply_on_both_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $query = '?date_from=2026-01-11&date_to=2026-01-11';

        $report = $this->getJson("/api/reports/services{$query}");
        $report->assertOk();
        $this->assertCount(1, $report->json('data'));
        $this->assertEquals(100, $report->json('grand_totals.total_amount'));

        $summary = $this->getJson("/api/reports/services/summary{$query}");
        $summary->assertOk();
        $this->assertEquals(100, $summary->json('grand_totals.total_amount'));
        $this->assertCount(1, $summary->json('totals_by_day'));

        $byPlate = $this->getJson('/api/reports/services?plate=ABC');
        $this->assertCount(1, $byPlate->json('data'));
    }

    public function test_detailer_only_sees_reports_for_its_companies(): void
    {
        $otherService = Service::factory()->create();
        $otherCompany = Company::factory()->create(['default_service_id' => $otherService->id]);

        ServiceLog::create([
            'user_id'      => User::factory()->create(['role' => 'detailer'])->id,
            'company_id'   => $otherCompany->id,
            'service_id'   => $otherService->id,
            'car_plate'    => 'HIDDEN1',
            'performed_at' => '2026-01-10',
            'quantity'     => 1,
        ]);

        Sanctum::actingAs($this->detailer);

        $plates = collect($this->getJson('/api/reports/services')->json('data'))
            ->pluck('car_plate');

        $this->assertFalse($plates->contains('HIDDEN1'));
        $this->assertCount(2, $plates);

        $this->getJson("/api/reports/services?company_id={$otherCompany->id}")
            ->assertForbidden();
        $this->getJson("/api/reports/services/summary?company_id={$otherCompany->id}")
            ->assertForbidden();
    }
}
