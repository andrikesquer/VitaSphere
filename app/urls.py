from django.urls import path, include
from rest_framework import routers

from app import views


urlpatterns=[
    path('metrica/', views.metrica),

]


#router=routers.DefaultRouter()
#router.register(r'sensores',views.SensoresViewSet)
#urlpatterns=[
 #   path('',include(router.urls))
#]