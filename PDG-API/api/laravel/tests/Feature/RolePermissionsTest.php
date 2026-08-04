<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Service;
use App\Models\ServiceLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RolePermissionsTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function makeCompanyWithService(): array
    {
        $service = Service::factory()->create();
        $company = Company::factory()->create(['default_service_id' => $service->id]);
        $company->services()->sync([$service->id]);

        return [$company, $service];
    }

    private function makeLog(User $user, Company $company, Service $service): ServiceLog
    {
        return ServiceLog::create([
            'user_id' => $user->id,
            'company_id' => $company->id,
            'service_id' => $service->id,
            'car_plate' => 'ABC1234',
            'performed_at' => now()->toDateString(),
            'quantity' => 1,
        ]);
    }

    /* -------------------------------------------------
       1. Admin manages every detailer's service entries
    --------------------------------------------------*/

    public function test_admin_sees_service_logs_from_every_user(): void
    {
        [$company, $service] = $this->makeCompanyWithService();
        $detailer = $this->makeUser('detailer');
        $detailer->companies()->sync([$company->id]);
        $this->makeLog($detailer, $company, $service);

        Sanctum::actingAs($this->makeUser('admin'));

        $response = $this->getJson('/api/service-logs');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_admin_can_update_a_log_created_by_another_user(): void
    {
        [$company, $service] = $this->makeCompanyWithService();
        $detailer = $this->makeUser('detailer');
        $log = $this->makeLog($detailer, $company, $service);

        Sanctum::actingAs($this->makeUser('admin'));

        $this->putJson("/api/service-logs/{$log->id}", ['car_plate' => 'xyz9876'])
            ->assertOk();

        $this->assertSame('XYZ9876', $log->fresh()->car_plate);
    }

    public function test_detailer_cannot_touch_a_log_created_by_someone_else(): void
    {
        [$company, $service] = $this->makeCompanyWithService();
        $owner = $this->makeUser('detailer');
        $log = $this->makeLog($owner, $company, $service);

        $other = $this->makeUser('detailer');
        $other->companies()->sync([$company->id]);
        Sanctum::actingAs($other);

        $this->getJson("/api/service-logs/{$log->id}")->assertForbidden();
        $this->putJson("/api/service-logs/{$log->id}", ['quantity' => 5])->assertForbidden();
        $this->deleteJson("/api/service-logs/{$log->id}")->assertForbidden();
    }

    public function test_detailer_sees_and_updates_only_its_own_logs(): void
    {
        [$company, $service] = $this->makeCompanyWithService();
        $detailer = $this->makeUser('detailer');
        $detailer->companies()->sync([$company->id]);

        $own = $this->makeLog($detailer, $company, $service);
        $this->makeLog($this->makeUser('detailer'), $company, $service);

        Sanctum::actingAs($detailer);

        $response = $this->getJson('/api/service-logs');
        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame($own->id, $response->json('data.0.id'));

        $this->putJson("/api/service-logs/{$own->id}", ['quantity' => 3])->assertOk();
        $this->assertSame(3, $own->fresh()->quantity);
    }

    /* -------------------------------------------------
       2. Supervisor never receives cost values
    --------------------------------------------------*/

    public function test_supervisor_does_not_receive_cost_values(): void
    {
        [$company, $service] = $this->makeCompanyWithService();
        $supervisor = $this->makeUser('supervisor');
        $this->makeLog($supervisor, $company, $service);

        Sanctum::actingAs($supervisor);

        $logs = $this->getJson('/api/service-logs');
        $logs->assertOk();
        $this->assertArrayNotHasKey('cost_value', $logs->json('data.0.service'));

        $report = $this->getJson('/api/reports/services');
        $report->assertOk();
        $report->assertJsonPath('can_see_costs', false);
        $this->assertArrayNotHasKey('total_cost_amount', $report->json('grand_totals'));
        $this->assertArrayNotHasKey('total_cost_amount', $report->json('data.0'));
        $this->assertArrayNotHasKey('service_unit_cost_value', $report->json('data.0'));
    }

    public function test_admin_still_receives_cost_values(): void
    {
        [$company, $service] = $this->makeCompanyWithService();
        $admin = $this->makeUser('admin');
        $this->makeLog($admin, $company, $service);

        Sanctum::actingAs($admin);

        $logs = $this->getJson('/api/service-logs');
        $logs->assertOk();
        $this->assertArrayHasKey('cost_value', $logs->json('data.0.service'));

        $report = $this->getJson('/api/reports/services');
        $report->assertOk();
        $report->assertJsonPath('can_see_costs', true);
        $this->assertArrayHasKey('total_cost_amount', $report->json('grand_totals'));
    }

    /* -------------------------------------------------
       3. Detailer only sees the companies linked to it
    --------------------------------------------------*/

    public function test_detailer_only_lists_its_linked_companies(): void
    {
        [$linked] = $this->makeCompanyWithService();
        [$other] = $this->makeCompanyWithService();

        $detailer = $this->makeUser('detailer');
        $detailer->companies()->sync([$linked->id]);

        Sanctum::actingAs($detailer);

        $response = $this->getJson('/api/companies');
        $response->assertOk();

        $ids = array_column($response->json('data'), 'id');
        $this->assertSame([$linked->id], $ids);

        $this->getJson("/api/companies/{$linked->id}")->assertOk();
        $this->getJson("/api/companies/{$other->id}")->assertForbidden();
    }

    public function test_detailer_cannot_link_itself_to_extra_companies(): void
    {
        [$linked] = $this->makeCompanyWithService();
        [$other] = $this->makeCompanyWithService();

        $detailer = $this->makeUser('detailer');
        $detailer->companies()->sync([$linked->id]);

        Sanctum::actingAs($detailer);

        // Editing its own profile must not let it grant itself another store.
        $this->patchJson("/api/users/{$detailer->id}", [
            'company_ids' => [$linked->id, $other->id],
        ])->assertOk();

        $this->assertSame([$linked->id], $detailer->companies()->pluck('companies.id')->all());
    }

    public function test_non_admin_cannot_edit_another_user(): void
    {
        $target = $this->makeUser('detailer');

        Sanctum::actingAs($this->makeUser('supervisor'));

        $this->patchJson("/api/users/{$target->id}", ['display_name' => 'Hacked'])
            ->assertForbidden();
        $this->deleteJson("/api/users/{$target->id}")->assertForbidden();

        $this->assertNotSame('Hacked', $target->fresh()->display_name);
    }

    public function test_admin_lists_every_company(): void
    {
        [$first] = $this->makeCompanyWithService();
        [$second] = $this->makeCompanyWithService();

        Sanctum::actingAs($this->makeUser('admin'));

        $response = $this->getJson('/api/companies');
        $response->assertOk();

        $ids = array_column($response->json('data'), 'id');
        sort($ids);
        $this->assertSame([$first->id, $second->id], $ids);
    }
}
