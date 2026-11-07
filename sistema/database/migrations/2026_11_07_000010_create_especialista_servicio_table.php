<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('especialista_servicio', function (Blueprint $table) {
            $table->foreignId('especialista_id')->constrained('especialistas')->cascadeOnDelete();
            $table->foreignId('servicio_id')->constrained('servicios')->cascadeOnDelete();
            $table->primary(['especialista_id', 'servicio_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('especialista_servicio');
    }
};
