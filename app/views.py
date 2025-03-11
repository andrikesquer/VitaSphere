from django.shortcuts import redirect, render
from django.http import HttpResponse
from django.contrib.auth.hashers import make_password
from bson.objectid import ObjectId 
from django.contrib.auth.hashers import check_password
from .models import users_collection

def register(request):
    if request.method == "POST":
            name = request.POST.get("fname")
            apellidos = request.POST.get("lname")
            telefono = request.POST.get("tel")
            email = request.POST.get("email")
            password = request.POST.get("pass")
            conf_pass = request.POST.get("confpass")
            fecha = request.POST.get("birthday")

            existing_user = users_collection.find_one({"email": email})
            if existing_user:
                return HttpResponse("El usuario ya existe", status=400)

            hashed_password = make_password(password)
            hashed_confpassword = make_password(conf_pass)

            users_collection.insert_one({
                "_id": ObjectId(),
                "nombre": name,
                "apellidos": apellidos,
                "telefono": telefono,
                "email": email,
                "password": hashed_password,
                "confpassword": hashed_confpassword,
                "fecha":fecha
            })

            return redirect("login")

    return render(request, "register.html")

def login(request):
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        if not email or not password:
            return HttpResponse("Por favor, ingresa usuario y contraseña", status=400)

        user = users_collection.find_one({"email": email})

        if user and check_password(password, user["password"]):
            request.session["email"] = user["email"]
            request.session["nombre"] = user["nombre"]
            request.session["is_authenticated"] = True
    
            return redirect("users")

        return HttpResponse("Usuario o contraseña incorrectos", status=401)

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

def profile (request):
    return render(request, "profile.html")
    
def settings (request):
    return render(request, 'settings.html')
