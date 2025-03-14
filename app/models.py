from django.db import models
from db_conn import db

users_collection = db['Users']

class Lectura_sen(models.Model):
    pulsaciones = models.IntegerField()
    oxigenacion = models.FloatField()
    temperatura = models.FloatField()

