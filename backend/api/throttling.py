from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class ClientOTPThrottle(UserRateThrottle):
    scope = 'client_otp'
    rate = '5/hour'

class RDVAnonThrottle(AnonRateThrottle):
    scope = 'rdv_anon'
    rate = '3/day'

class RDVUserThrottle(UserRateThrottle):
    scope = 'rdv_user'
    rate = '10/day'
