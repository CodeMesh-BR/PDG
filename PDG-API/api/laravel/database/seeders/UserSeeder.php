<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Service;
use App\Models\Company;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'display_name' => 'Admin',
                'full_name'    => 'Admin User',
                'password'     => Hash::make('admin12345'), // 8–16
                'role'         => 'admin',
                'address'      => 'Av. Principal, 100',
                'phone'        => '+351 900000000',
                'availability' => ['mon', 'tue', 'wed', 'thu', 'fri'],
            ]
        );

        // Usuário comum
        User::updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'display_name' => 'User',
                'full_name'    => 'Regular User',
                'password'     => Hash::make('user12345'),
                'role'         => 'user',
                'address'      => 'Rua Secundária, 200',
                'phone'        => '+351 911111111',
                'availability' => ['sat', 'sun'],
            ]
        );

        // Cliente de demonstração, vinculado à empresa "Alpha Central"
        $client = User::updateOrCreate(
            ['email' => 'client@example.com'],
            [
                'display_name' => 'Client',
                'full_name'    => 'Demo Client',
                'password'     => Hash::make('client12345'),
                'role'         => 'client',
            ]
        );

        $alpha = Company::where('email', 'alpha@example.com')->first();
        if ($alpha) {
            $client->companies()->sync([$alpha->id]);
        }

        // +10 usuários aleatórios
        User::factory()->count(10)->create();

        $admin = User::where('email', 'admin@example.com')->first();
        $serviceIds = Service::inRandomOrder()->limit(3)->pluck('id');
        $admin->services()->sync($serviceIds);
    }
}
