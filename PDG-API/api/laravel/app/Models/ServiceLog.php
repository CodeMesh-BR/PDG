<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceLog extends Model
{
    protected $fillable = [
        'user_id',
        'company_id',
        'service_id',
        'car_plate',
        'performed_at',
        'quantity',
        'notes',
    ];

    protected $casts = [
        'performed_at' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function company()
    {
        return $this->belongsTo(\App\Models\Company::class);
    }

    public function service()
    {
        return $this->belongsTo(\App\Models\Service::class);
    }
}
