<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
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
                'password'     => Hash::make('admin1234'), // 8–16
                'role'         => 'admin',
                'address'      => 'Av. Principal, 100',
                'phone'        => '+351 900000000',
                'skills'       => ['service-cleaning', 'buffers'],
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
                'skills'       => ['delivery-cleaning'],
                'availability' => ['sat', 'sun'],
            ]
        );

        // +10 usuários aleatórios
        User::factory()->count(10)->create();
    }
}
