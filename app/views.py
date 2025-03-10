from django.shortcuts import redirect, render
from django.http import HttpResponse
from django.contrib.auth.hashers import make_password
from bson.objectid import ObjectId 
from django.contrib.auth.hashers import check_password
from project.settings import SECRET_KEY
from .models import users_collection
from django.contrib.auth.decorators import login_required
import hashlib
import hmac
import base64


def encriptar_password(password: str) -> str:
    """Hashea la contraseña usando HMAC-SHA256 y la clave secreta."""
    hashed = hmac.new(SECRET_KEY.encode(), password.encode(), hashlib.sha256).digest()
    return base64.b64encode(hashed).decode()

def register(request):
    if request.method == "POST":
        name = request.POST.get("fname")
        apellidos = request.POST.get("lname")
        telefono = request.POST.get("tel")
        email = request.POST.get("email")
        password = request.POST.get("pass")
        conf_pass = request.POST.get("confpass")
        fecha = request.POST.get("birthday")

        # Validar si las contraseñas coinciden
        if password != conf_pass:
            return HttpResponse("Las contraseñas no coinciden", status=400)

        # Verificar si el usuario ya existe
        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            return HttpResponse("El usuario ya existe", status=400)

        # Hashear la contraseña con HMAC-SHA256
        hashed_password = encriptar_password(password)

        # Insertar en la base de datos
        users_collection.insert_one({
            "_id": ObjectId(),
            "nombre": name.strip(),
            "apellidos": apellidos.strip(),
            "telefono": telefono.strip(),
            "email": email.strip(),
            "password": hashed_password,
            "confpassword": hashed_password,  # Se almacena para compatibilidad con Flutter
            "fecha": fecha.strip()
        })

        return redirect("login")

    return render(request, "register.html")
def login(request):
    if request.method == "POST":
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "").strip()

        if not email or not password:
            return HttpResponse("❌ Por favor, ingresa usuario y contraseña", status=400)

        user = users_collection.find_one({"email": email})

        if not user:
            return HttpResponse("❌ Usuario no encontrado", status=401)

        # Extraer la contraseña almacenada
        stored_password = user.get("password")
        stored_confpassword = user.get("confpassword")

        # Encriptar la contraseña ingresada y compararla con la almacenada
        hashed_password = encriptar_password(password)

        if hashed_password == stored_password or hashed_password == stored_confpassword:
            request.session["email"] = user["email"]
            request.session["nombre"] = user["nombre"]
            request.session["is_authenticated"] = True

            return redirect("users")

        return HttpResponse("❌ Usuario o contraseña incorrectos", status=401)

    return render(request, "login.html")

def logout_view(request):
    request.session.flush()
    return redirect("login")

def users(request):
    if not request.session.get("is_authenticated", False):
        return redirect("login")

    user_list = users_collection.find({}, {"_id": 0, "username": 1, "email": 1})

    return render(request, "users.html", {"users": user_list})

def home (request):
    return render(request, "home.html")

def statistics(request):
    return render(request, "statistics.html")

def profile(request):
    #Descomentar las lineas inferiores para que el usuario no pueda acceder a la pagina de profile sin haber iniciado sesion
    #if not request.session.get("is_authenticated", False):
        #return redirect("login")  
    return render(request, 'profile.html')
    
def settings (request):
    return render(request, 'settings.html')
