"""
Q2 — Imports communs partagés par tous les sous-modules de views/.
"""
import random
import logging
from decimal import Decimal

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db import models, transaction
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.contrib.auth.models import User
from django.core.mail import EmailMessage
from django.conf import settings
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill

from api.services import send_otp_sms, generate_repair_summary, suggest_parts_ai
from api.utils import generate_document_pdf, generate_fiche_reception_pdf
from api.models import (
    Client, Vehicule, Reparation, Stock, Facture, LigneTravail, LignePiece,
    MouvementCaisse, Devis, MaintenancePredictive, Appointment,
    NotificationClient, Avis, NotificationStaff, MouvementStock, ClientOTP
)
from api.serializers import (
    ClientSerializer, VehiculeSerializer, ReparationSerializer,
    StockSerializer, UserSerializer, MiniVehiculeSerializer,
    FactureSerializer, LigneTravailSerializer, LignePieceSerializer,
    MouvementCaisseSerializer, DevisSerializer, MaintenancePredictiveSerializer,
    AppointmentSerializer, NotificationClientSerializer, AvisSerializer,
    NotificationStaffSerializer, MouvementStockSerializer,
)
from .permissions import IsDirecteur, IsStaffMember, RDVAnonThrottle, RDVUserThrottle
