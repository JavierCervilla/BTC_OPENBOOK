# Usar la imagen oficial de Deno
FROM denoland/deno:2.1.5

# Crear el directorio de trabajo
WORKDIR /app

# Copiar el archivo del puente
COPY . .

# Exponer el puerto
EXPOSE 3001

# Ejecutar el servidor Deno
CMD ["deno", "task", "start"]
