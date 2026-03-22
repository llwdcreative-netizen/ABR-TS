from run import db

class Envio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    estado = db.Column(db.String(50), nullable=False)
    # otros campos...
