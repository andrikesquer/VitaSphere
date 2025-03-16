from django.db import models
from datetime import datetime
from django.utils import timezone


from db_conn import db

users_collection = db['Users']
sensores = db['Registro']

class Lectura_sen(models.Model):
    fecha_hora = models.DateTimeField(default=timezone.now)
    pulsaciones = models.IntegerField()
    oxigenacion = models.FloatField()
    temperatura = models.FloatField()



