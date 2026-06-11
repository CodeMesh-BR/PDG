<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Department;
use Illuminate\Database\Seeder;
use App\Models\Service;
use App\Models\User;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $serviceDepartment = Department::firstOrCreate(
            ['name' => 'Service'],
            [
                'description' => 'Charged per car.',
                'bill_by_unit' => true,
                'bill_by_hour' => false,
                'bill_by_quantity' => false,
            ]
        );

        $catalog = [
            ['type' => 'Cleaning',          'description' => 'Exterior cleaning',         'value' => 25.00,  'cost_value' => 25.00,  'department_id' => $serviceDepartment->id],
            ['type' => 'Delivery Cleaning', 'description' => 'Pre-delivery cleaning',     'value' => 40.00,  'cost_value' => 40.00,  'department_id' => $serviceDepartment->id],
            ['type' => 'Full Detail',       'description' => 'Complete detailing',        'value' => 120.00, 'cost_value' => 120.00, 'department_id' => $serviceDepartment->id],
            ['type' => 'Paint Correction',  'description' => 'Paint correction service',  'value' => 200.00, 'cost_value' => 200.00, 'department_id' => $serviceDepartment->id],
            ['type' => 'Paint Protection',  'description' => 'Paint protection coating',  'value' => 350.00, 'cost_value' => 350.00, 'department_id' => $serviceDepartment->id],
            ['type' => 'Buffers',           'description' => 'Buffing service',           'value' => 80.00,  'cost_value' => 80.00,  'department_id' => $serviceDepartment->id],
        ];

        foreach ($catalog as $item) {
            $service = Service::firstOrCreate(
                ['type' => $item['type']],
                [
                    'description' => $item['description'],
                    'value' => $item['value'],
                    'cost_value' => $item['cost_value'],
                    'department_id' => $item['department_id'],
                ]
            );

            if (!$service->department_id) {
                $service->update(['department_id' => $item['department_id']]);
            }
        }

        $serviceIds = Service::pluck('id')->all();
        if (empty($serviceIds)) return;

        User::chunk(100, function ($users) use ($serviceIds) {
            foreach ($users as $user) {
                $pick = collect($serviceIds)->shuffle()->take(rand(1, 3))->values()->all();
                $user->services()->syncWithoutDetaching($pick);
            }
        });

        Company::chunk(100, function ($companies) use ($serviceIds) {
            foreach ($companies as $company) {
                $pick = collect($serviceIds)->shuffle()->take(rand(1, 3))->values()->all();
                $company->services()->syncWithoutDetaching($pick);
            }
        });
    }
}
