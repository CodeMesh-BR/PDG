<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'bill_by_unit',
        'bill_by_hour',
        'bill_by_quantity',
    ];

    protected $casts = [
        'bill_by_unit' => 'boolean',
        'bill_by_hour' => 'boolean',
        'bill_by_quantity' => 'boolean',
    ];

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function serviceLogs()
    {
        return $this->hasMany(ServiceLog::class);
    }
}
