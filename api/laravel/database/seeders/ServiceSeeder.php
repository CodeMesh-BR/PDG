<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;
use App\Models\User;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            ['type' => 'Cleaning',          'description' => 'Exterior cleaning',         'value' => 25.00],
            ['type' => 'Delivery Cleaning', 'description' => 'Pre-delivery cleaning',     'value' => 40.00],
            ['type' => 'Full Detail',       'description' => 'Complete detailing',        'value' => 120.00],
            ['type' => 'Paint Correction',  'description' => 'Paint correction service',  'value' => 200.00],
            ['type' => 'Paint Protection',  'description' => 'Paint protection coating',  'value' => 350.00],
            ['type' => 'Buffers',           'description' => 'Buffing service',           'value' => 80.00],
        ];

        foreach ($catalog as $item) {
            Service::firstOrCreate(
                ['type' => $item['type']],
                ['description' => $item['description'], 'value' => $item['value']]
            );
        }

        $serviceIds = Service::pluck('id')->all();
        if (empty($serviceIds)) return;

        User::chunk(100, function ($users) use ($serviceIds) {
            foreach ($users as $user) {
                $pick = collect($serviceIds)->shuffle()->take(rand(1, 3))->values()->all();
                $user->services()->syncWithoutDetaching($pick);
            }
        });
    }
}
