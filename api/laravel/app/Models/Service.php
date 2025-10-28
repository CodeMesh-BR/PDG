<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'description',
        'value'
    ];

    protected $casts = [
        'value' => 'decimal:2',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'service_user')->withTimestamps();
    }

    public function companies()
    {
        return $this->belongsToMany(Company::class, 'service_company')->withTimestamps();
    }
}
