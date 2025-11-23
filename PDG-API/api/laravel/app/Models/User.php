<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'display_name',
        'full_name',
        'address',
        'phone',
        'role',
        'email',
        'password',
        'availability',
        'contract_pdf_path',
        'work_certificate_pdf_path',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'availability' => 'array',
        'email_verified_at' => 'datetime',
    ];

    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_user')->withTimestamps();
    }
}
