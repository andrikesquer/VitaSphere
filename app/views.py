from datetime import datetime, timedelta
import json
import random
from django.shortcuts import redirect, render
from django.http import HttpResponse, JsonResponse
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

        if password != conf_pass:
            return HttpResponse("Las contraseñas no coinciden", status=400)

        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            return HttpResponse("El usuario ya existe", status=400)

        hashed_password = encriptar_password(password)

        users_collection.insert_one({
            "_id": ObjectId(),
            "nombre": name.strip(),
            "apellidos": apellidos.strip(),
            "telefono": telefono.strip(),
            "email": email.strip(),
            "password": hashed_password,
            "confpassword": hashed_password,
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

        stored_password = user.get("password")
        stored_confpassword = user.get("confpassword")

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
    data = {
        'categories': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        'pulso': [72, 75, 78, 80, 76,90,100,],
        'oxigeno': [98, 97, 99, 96, 98,60,70],
        'temperatura': [37, 36.8, 37.2, 37.5, 37.1, 45,50],
    }
    
    return render(request, 'statistics.html', {'data_json': json.dumps(data)})

def profile(request):
    #Descomentar las lineas inferiores para que el usuario no pueda acceder a la pagina de profile sin haber iniciado sesion
    #if not request.session.get("is_authenticated", False):
        #return redirect("login")  
    return render(request, 'profile.html')
    
def settings (request):
    return render(request, 'settings.html')

def get_live_data(request):
    """Genera datos dinámicos para Highcharts"""
    
    # Obtener la hora actual
    now = datetime.now()
    
    # Generar una lista de las últimas 10 horas
    horas = [(now - timedelta(hours=i)).strftime("%H:%M") for i in range(9, -1, -1)]
    
    # Generar datos aleatorios para cada hora
    data = {
        "categories": horas,  # Eje X (Horas)
        "pulso": [random.randint(60, 100) for _ in range(10)],
        "oxigeno": [random.randint(95, 100) for _ in range(10)],
        "temperatura": [round(random.uniform(36.5, 37.5), 1) for _ in range(10)]
    }
    
    return JsonResponse(data)
