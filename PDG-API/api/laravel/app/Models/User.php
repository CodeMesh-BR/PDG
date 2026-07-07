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

    public function companies()
    {
        return $this->belongsToMany(Company::class, 'company_user')->withTimestamps();
    }

    public function isRestrictedToCompanies(): bool
    {
        return in_array(strtolower(trim((string) $this->role)), ['detailer', 'client'], true);
    }

    /**
     * Null means unrestricted (sees every company); an array (possibly empty)
     * means the user is limited to those company IDs.
     */
    public function allowedCompanyIds(): ?array
    {
        if (!$this->isRestrictedToCompanies()) {
            return null;
        }

        return $this->companies()->pluck('companies.id')->all();
    }
}
