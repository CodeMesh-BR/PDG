<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('service_logs', function (Blueprint $table) {
            $table->string('car_plate', 20)->after('service_id');
            $table->index(['car_plate']);
        });
    }

    public function down(): void
    {
        Schema::table('service_logs', function (Blueprint $table) {
            $table->dropColumn('car_plate');
        });
    }
};
