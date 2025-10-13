<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/** @extends Factory<\App\Models\User> */
class UserFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->name();

        // exemplos de skills/dias
        $allSkills = [
            'service-cleaning',
            'delivery-cleaning',
            'full-details',
            'paint-correction',
            'paint-protection',
            'buffers'
        ];
        $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

        return [
            'display_name' => $name,
            'full_name'    => $name,
            'email'        => $this->faker->unique()->safeEmail(),
            'password'     => Hash::make('abc12345'), // 8–16, letras+numeros
            'role'         => 'user',
            'address'      => $this->faker->streetAddress(),
            'phone'        => '+351 9' . $this->faker->numerify('########'),
            'skills'       => $this->faker->randomElements($allSkills, rand(1, 3)),
            'availability' => $this->faker->randomElements($days, rand(3, 6)),
            'contract_pdf_path'         => null,
            'work_certificate_pdf_path' => null,
        ];
    }
}
