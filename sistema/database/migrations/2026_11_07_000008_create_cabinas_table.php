<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cabinas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estado_cabina_id')->constrained('estados_cabina');
            $table->string('nombre', 60)->unique();
            $table->string('tipo_servicio', 60);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cabinas');
    }
};
