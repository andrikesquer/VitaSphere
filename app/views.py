from datetime import datetime, timedelta

import random
from django.utils import timezone

from django.shortcuts import redirect, render
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from bson.objectid import ObjectId 
from rest_framework.parsers import JSONParser
from project.settings import SECRET_KEY

import hashlib
import hmac
import base64
from pymongo.errors import PyMongoError
from .models import users_collection, sensores
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets
import pytz

#from twilio.rest import Client  No se va a usar

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart



#to_num = "+526141591868"
#msg= "Se ha caido el abuelito"


@csrf_exempt
def metrica(request):

   # if not request.session.get("is_authenticated", False):
    #        return JsonResponse({"error": "El usuario no esta inicio seccion"}, status=500)
    if  request.method == 'GET':

        return HttpResponse("lol")  #que hace esto?, se puede quitar?

    if  request.method == 'POST':
        data = JSONParser().parse(request)

        cst = pytz.timezone('America/Mexico_City')
        now = timezone.now().astimezone(cst)
        data.update({
            "fecha": now.strftime("%Y-%m-%d"),
            "hora": now.strftime("%H:%M:%S"),
            "id_usuario":request.session.get("id")
        })
        print(data)
        result = sensores.insert_one(data)
        if(data["tipo"] == "Alerta"):
            print("Son alerta")
        else:
            print("es metrica")

        #NO SE SI ESTE BIEN
        if result.inserted_id:
            return JsonResponse({"message": "Inserción exitosa", "id": str(result.inserted_id)}, status=201)
        else:
            return JsonResponse({"error": "Error al insertar en la base de datos"}, status=500)


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
            messages.error(request, "Las contraseñas no coinciden")
            return redirect("register")

        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            messages.error(request, "El correo ya está registrado")
            return redirect("register")

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
       # request.session["nombre"] = lname
       # request.session["apellidos"] = fname
        #request.session["fecha_nacimiento"] = birthday
        #request.session["sexo"] = sex
        #request.session["tel"] = tel
        #request.session["email"] = email
        #request.session["is_authenticated"] = True

        return redirect("login")
    
    return render(request, "register.html")

def login(request):
    if request.method == "POST":
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "").strip()

        if not email or not password:
            messages.error(request, "Correo y contraseña son obligatorios")
            return redirect("login")

        user = users_collection.find_one({"email": email})

        if not user:
            messages.error(request, "Usuario no encontrado")
            return redirect("login")

        if user.get("estado") != "activo":
            messages.error(request, "Usuario inactivo") 
            return redirect("login")

        stored_password = user.get("password")


        hashed_password = encriptar_password(password)

        if hashed_password == stored_password:
            request.session["id"] = str(user["_id"])
            request.session["nombre"] = user["nombre"]
            request.session["apellidos"] = user["apellidos"]
            request.session["fecha_nacimiento"] = user["fecha_nacimiento"]
            request.session["sexo"] = user["sexo"]
            request.session["email"] = user["email"]
            request.session["tel"] = user["telefono"]
            request.session["is_authenticated"] = True
            #send_msg(to_num,msg)
            enviar_alertas(request, "Alerta de inicio de sesión", "Se ha iniciado sesión en tu cuenta")
            return redirect("/")

        messages.error(request, "Usuario o contraseña incorrectos")
        return redirect("login")
    

    return render(request, "login.html")

def logout_view(request):
    request.session.flush()
    return redirect("/")

def home (request):
    return render(request, "home.html")

def statistics(request):
    ultimo = sensores.find({"tipo":"Metricas"}).sort("_id", -1).limit(1)
    caida = sensores.count_documents({"categoria":"caida"})
    user_id = request.session.get("id")
    user_id = ObjectId(user_id)
    nombre = users_collection.find_one({"_id":user_id})

    ult={}
    for f in ultimo :
        ult.update({"pul":(f["pulsaciones"])})
        ult.update({"oxi":(f["oxigenacion"])})
        ult.update({"tmpe":(f["temperatura"])})

    ult.update({"fall":caida})
    ult.update({"name":nombre["nombre"]})
    return render(request, 'statistics.html', {'ultimos': ult})

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
    """Genera datos dinámicos para Highcharts"""

    datas = list(sensores.find({"tipo": "Metricas"}).sort("_id", -1).limit(10))  # Convertimos el cursor en lista
    caida = sensores.count_documents({"categoria":"caida"})
    user_id = request.session.get("id")
    user_id = ObjectId(user_id)
    pulsos = [doc["pulsaciones"] for doc in datas]
    oxigeno = [doc["oxigenacion"] for doc in datas]
    temperatura = [doc["temperatura"] for doc in datas]
    horas = [doc["hora"] for doc in datas]
    pulsos.reverse()
    oxigeno.reverse()
    temperatura.reverse()
    horas.reverse()

    p=pulsos.copy()
    o=oxigeno.copy()
    t=temperatura.copy()


    print(horas)
    print(caida)


    # Obtener la hora actual
    now = datetime.now()
    
    # Generar una lista de las últimas 10 horas
    #horas = [(now - timedelta(hours=i)).strftime("%H:%M") for i in range(9, -1, -1)]
    
    # Generar datos aleatorios para cada hora
    data = {
        "categories": horas,  # Eje X (Horas)
        "pulso": pulsos, #[random.randint(60, 100) for _ in range(10)],
        "oxigeno": oxigeno,#[random.randint(95, 100) for _ in range(10)],
        "temperatura": temperatura,#[round(random.uniform(36.5, 37.5), 1) for _ in range(10)]
        "ls":p.pop(),
        "lo":o.pop(),
        "lte":t.pop(),
        "cai":caida,

    }
    
    return JsonResponse(data)




def send_email(to_emails, subject, body):
    sender_email = "arturo2005sidas@gmail.com"
    sender_password = "ypmt jorj tdiy mifc"

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = ", ".join(to_emails) 
    message["Subject"] = subject

    message.attach(MIMEText(body, "plain"))

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender_email, sender_password) 
    server.sendmail(sender_email, to_emails, message.as_string())
    server.quit()

    print("Correo enviado exitosamente")


def enviar_alertas(request, title, body):
    usuario = users_collection.find_one({"_id": ObjectId(request.session.get("id"))})
    if usuario and 'contacts' in usuario:
        correos = [contact['telefono'] for contact in usuario['contacts']]

        for correo in correos:
            send_email([correo], title, body)

        return HttpResponse("Alertas enviadas correctamente")
    else:
        return HttpResponse("Usuario no encontrado", status=404)

