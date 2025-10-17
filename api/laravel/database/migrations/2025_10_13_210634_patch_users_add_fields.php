<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1) Adicionar colunas que possam não existir ainda
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'display_name')) {
                $table->string('display_name', 150)->nullable();
            }
            if (!Schema::hasColumn('users', 'full_name')) {
                $table->string('full_name', 150)->nullable();
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role', 50)->default('user');
            }
            if (!Schema::hasColumn('users', 'address')) {
                $table->string('address', 255)->nullable();
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 20)->nullable();
            }
            if (!Schema::hasColumn('users', 'availability')) {
                $table->json('availability')->nullable();
            }
            if (!Schema::hasColumn('users', 'contract_pdf_path')) {
                $table->string('contract_pdf_path')->nullable();
            }
            if (!Schema::hasColumn('users', 'work_certificate_pdf_path')) {
                $table->string('work_certificate_pdf_path')->nullable();
            }
        });

        if (Schema::hasColumn('users', 'display_name')) {
            $hasNameCol = Schema::hasColumn('users', 'name') ? 'name' : 'NULL';
            DB::statement("
                UPDATE users
                SET display_name = COALESCE(display_name, full_name, {$hasNameCol})
                WHERE display_name IS NULL
            ");
            DB::statement("ALTER TABLE users ALTER COLUMN display_name SET NOT NULL");
        }

        if (Schema::hasColumn('users', 'full_name')) {
            $hasNameCol = Schema::hasColumn('users', 'name') ? 'name' : 'display_name';
            DB::statement("
                UPDATE users
                SET full_name = COALESCE(full_name, {$hasNameCol})
                WHERE full_name IS NULL
            ");
        }

        if (Schema::hasColumn('users', 'name')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'work_certificate_pdf_path')) {
                $table->dropColumn('work_certificate_pdf_path');
            }
            if (Schema::hasColumn('users', 'contract_pdf_path')) {
                $table->dropColumn('contract_pdf_path');
            }
            if (Schema::hasColumn('users', 'availability')) {
                $table->dropColumn('availability');
            }
            if (Schema::hasColumn('users', 'phone')) {
                $table->dropColumn('phone');
            }
            if (Schema::hasColumn('users', 'address')) {
                $table->dropColumn('address');
            }
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
            if (Schema::hasColumn('users', 'full_name')) {
                $table->dropColumn('full_name');
            }
            if (Schema::hasColumn('users', 'display_name')) {
                $table->dropColumn('display_name');
            }
        });
    }
};
