# Inicializa Git solo si no está ya inicializado
if (-not (Test-Path ".git")) {
    git init
}

# Asegura que no haya un remoto origin duplicado
try { git remote remove origin 2>$null } catch {}

# Conecta con GitHub
git remote add origin https://github.com/BlecoSRL/aweyt.git

# Cambia la rama actual a main
git branch -M main

# Agrega todos los archivos (excepto los ignorados)
git add .

# Crea commit solo si hay cambios
if (git status --porcelain) {
    git commit -m "Primera publicación del proyecto Aweyt"
}

# Sube a GitHub
git push -u origin main
