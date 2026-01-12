<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Company extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'display_name',
        'email',
        'address',
        'phone',
        'default_service_id',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function services()
    {
        return $this->belongsToMany(\App\Models\Service::class, 'service_company');
    }

    public function defaultService()
    {
        return $this->belongsTo(\App\Models\Service::class, 'default_service_id');
    }
}
