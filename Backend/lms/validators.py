from django.core.exceptions import ValidationError

def validate_pdf_file(value):
    """
    Validate that the uploaded file is a PDF and under 5MB
    """
    # Check file extension
    if not value.name.lower().endswith('.pdf'):
        raise ValidationError('Only PDF files are allowed.')
    
    # Check file size
    max_size = 5 * 1024 * 1024  # 5MB
    if value.size > max_size:
        raise ValidationError(
            f'PDF file size must be under 5 MB. Current size: {value.size / (1024 * 1024):.2f} MB'
        )
    
    return value