<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_logs', function (Blueprint $table) {
            $table->string('vehicle_condition', 10)->nullable()->after('car_plate');
            $table->string('stock_number', 50)->nullable()->after('vehicle_condition');
            $table->index(['vehicle_condition']);
            $table->index(['stock_number']);

            // car_plate passa a ser opcional (portável entre MySQL/Postgres)
            $table->string('car_plate', 20)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('service_logs', function (Blueprint $table) {
            $table->dropIndex(['vehicle_condition']);
            $table->dropIndex(['stock_number']);
            $table->dropColumn(['vehicle_condition', 'stock_number']);
        });
    }
};
