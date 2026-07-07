<?php

namespace App\Traits;

use App\Models\User;

trait RestrictsCompanyAccess
{
    protected function applyCompanyRestriction($query, User $user, string $column = 'company_id')
    {
        $allowed = $user->allowedCompanyIds();

        if ($allowed !== null) {
            $query->whereIn($column, $allowed);
        }

        return $query;
    }

    protected function ensureCompanyAllowed(User $user, ?int $companyId): bool
    {
        $allowed = $user->allowedCompanyIds();

        if ($allowed === null) {
            return true;
        }

        return $companyId !== null && in_array($companyId, $allowed, true);
    }
}
