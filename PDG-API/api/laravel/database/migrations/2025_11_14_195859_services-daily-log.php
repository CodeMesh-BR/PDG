<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();

            // data do serviço (diário)
            $table->date('performed_at');

            // quantas vezes fez esse serviço nesse lançamento
            $table->unsignedInteger('quantity')->default(1);

            // opcional para observações daquele lançamento
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'company_id', 'performed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_logs');
    }
};
