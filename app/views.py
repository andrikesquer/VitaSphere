from datetime import datetime, timedelta
import json
import random
from django.shortcuts import redirect, render
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.contrib.auth.hashers import make_password
from bson.objectid import ObjectId 
from django.contrib.auth.hashers import check_password
from rest_framework.parsers import JSONParser
from project.settings import SECRET_KEY
from .models import users_collection
from django.contrib.auth.decorators import login_required
import hashlib
import hmac
import base64
from pymongo.errors import PyMongoError
from .models import users_collection, sensores
from django.views.decorators.csrf import csrf_exempt
import json
from rest_framework import viewsets
from .serializers import SensoresSerializer
from .models import Lectura_sen

class SensoresViewSet(viewsets.ModelViewSet):
    queryset = Lectura_sen.objects.all()
    serializer_class = SensoresSerializer

@csrf_exempt
def metrica(request):
    if request.method == 'GET':
        snippets = Lectura_sen.objects.all()
        serializer = SensoresSerializer(snippets, many=True)
        return JsonResponse(serializer.data, safe=False)

    elif request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = SensoresSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            sensores.insert_one(data)

            # Serializar y guardar en Django ORM (opcional)
            serializer = SensoresSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse(serializer.data, status=201)
            return JsonResponse(serializer.errors, status=400)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

def encriptar_password(password: str) -> str:
    hashed = hmac.new(SECRET_KEY.encode(), password.encode(), hashlib.sha256).digest()
    return base64.b64encode(hashed).decode()

def register(request):
    if request.method == "POST":
        fname = request.POST.get("fname")
        lname = request.POST.get("lname")
        birthday = request.POST.get("birthday")
        sex = request.POST.get("sex")
        tel = request.POST.get("tel")
        email = request.POST.get("email")
        password = request.POST.get("pass")
        conf_pass = request.POST.get("confpass")

        if password != conf_pass:
            return HttpResponse("Las contraseñas no coinciden", status=400)

        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            return HttpResponse("Este correo electrónico ya se encuentra registrado", status=400)

        hashed_password = encriptar_password(password)

        users_collection.insert_one({
            "_id": ObjectId(),
            "nombre": fname.strip(),
            "apellidos": lname.strip(),
            "fecha_nacimiento": birthday.strip(),
            "sexo": sex.strip(),
            "telefono": tel.strip(),
            "email": email.strip(),
            "password": hashed_password,
            "estado": "activo",
        })

        # Iniciar sesión automáticamente
        request.session["nombre"] = lname
        request.session["apellidos"] = fname
        request.session["fecha_nacimiento"] = birthday
        request.session["sexo"] = sex
        request.session["tel"] = tel
        request.session["email"] = email
        request.session["is_authenticated"] = True

        return redirect("/")
    
    return render(request, "register.html")

def login(request):
    if request.method == "POST":
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "").strip()

        if not email or not password:
            return HttpResponse("Por favor, ingresa usuario y contraseña", status=400)

        user = users_collection.find_one({"email": email})

        if not user:
            return HttpResponse("Usuario no encontrado", status=401)

        if user.get("estado") != "activo":
            return HttpResponse("Tu cuenta está inactiva. Contacta al administrador.", status=403)

        stored_password = user.get("password")

        hashed_password = encriptar_password(password)

        if hashed_password == stored_password:
            request.session["id"] = str(user["_id"])
            request.session["nombre"] = user["nombre"]
            request.session["apellidos"] = user["apellidos"]
            #request.session["birthday"] = user["birthday"]
            request.session["sexo"] = user["sexo"]
            request.session["email"] = user["email"]
            request.session["tel"] = user["telefono"]
            request.session["is_authenticated"] = True

            return redirect("/")

        return HttpResponse("Usuario o contraseña incorrectos", status=401)

    return render(request, "login.html")

def logout_view(request):
    request.session.flush()
    return redirect("/")

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
    if not request.session.get("is_authenticated", False):
        return redirect("login")  
    return render(request, 'profile.html')

def update_profile(request):
    if request.method == "POST":
        try:
            # Obtener datos del formulario
            fname = request.POST.get("fname", "").strip()
            lname = request.POST.get("lname", "").strip()
            birthday = request.POST.get("birthday", "").strip()
            sex = request.POST.get("sex", "").strip()
            email = request.POST.get("email", "").strip()
            tel = request.POST.get("tel", "").strip()
            password = request.POST.get("password", "").strip()
            conf_pass = request.POST.get("conf_pass", "").strip()

            # Validaciones básicas
            if not all([fname, lname, birthday, email, tel, password, conf_pass]):
                messages.error(request, "No ha llenado todos los campos obligatorios")
                return redirect("profile")

            if password != conf_pass:
                messages.error(request, "Las contraseñas no coinciden")
                return redirect("profile")

            # Cifrar contraseña
            hashed_password = encriptar_password(password)

            # Obtener email actual de la sesión
            old_email = request.session.get("email")
            user = users_collection.find_one({"email": old_email})

            if not user:
                messages.error(request, "Usuario no encontrado")
                return redirect("profile")

            # Actualizar en base de datos
            update_data = {
                "nombre": fname,
                "apellidos": lname,
                "nacimiento": birthday,
                "sexo": sex,
                "telefono": tel,
                "email": email,
                "password": hashed_password
            }

            users_collection.update_one(
                {"email": old_email},
                {"$set": update_data}
            )

            # Actualizar sesión
            request.session.update({
                "nombre": fname,
                "apellidos": lname,
                "nacimiento": birthday,
                "sexo": sex,
                "email": email,
                "is_authenticated": True
            })

            messages.success(request, "Perfil actualizado correctamente")
            return redirect("profile")

        except PyMongoError as e:
            messages.error(request, "Error al actualizar el perfil")
            return redirect("profile")

    return render(request, "profile.html")

def delete_account(request):
    if request.method == "POST":
        email = request.session.get("email")
        result = users_collection.update_one(
            {"email": email}, 
            {"$set": {"estado": "inactivo"}}
        )
        if result.modified_count == 1:
            request.session.flush()
            return redirect("/")
        else:
            messages.error(request, "Error al eliminar cuenta, intente de nuevo")
            return redirect("/profile/")
    
def contacts (request):
    
    email = request.session.get("email")
    if not email:
        return redirect('login')

    user = users_collection.find_one({"email": email})
    if not user:
        return HttpResponse("Usuario no encontrado", status=404)

    contacts = user.get('contacts', [])
    return render(request, 'contacts.html', {'contacts': contacts})

def manage_contacts(request):
    if request.method == "POST":
        email = request.session.get('email')
        if not email:
            return redirect('login')

        # Procesar contactos existentes
        names = request.POST.getlist('name')
        tels = request.POST.getlist('tel')
        relations = request.POST.getlist('relation')

        # Procesar nuevos contactos
        new_names = request.POST.getlist('new_name')
        new_tels = request.POST.getlist('new_tel')
        new_relations = request.POST.getlist('new_relation')

        # Combinar todos los contactos
        contacts = [
            {'nombre': name, 'telefono': tel, 'relacion': rel}
            for name, tel, rel in zip(names + new_names, tels + new_tels, relations + new_relations)
        ]

        # Actualizar en Mongo
        users_collection.update_one(
            {'email': email},
            {'$set': {'contacts': contacts}}
        )

        return redirect('contacts')

    return redirect('contacts')

def get_live_data(request):
    
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
