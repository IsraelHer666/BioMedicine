document.addEventListener('DOMContentLoaded', () => {
  const deleteButtons = document.querySelectorAll('.delete-button');
  const modal = document.getElementById('deleteModal');
  const updateModal = document.getElementById('updateModal');
  const confirmDeleteButton = document.getElementById('confirmDeleteButton');
  const cancelDeleteButton = document.getElementById('cancelDeleteButton');
  const closeSpan = document.querySelector('#deleteModal .close');
  const closeUpdateSpan = document.querySelector('#updateModal .close-update');
  const confirmUpdateButton = document.getElementById('confirmUpdateButton');
  const medicationForms = document.querySelectorAll('.update-medication-form, #add-medication-form');
  let medicationIdToDelete = null;  
  let rowToDelete = null;
  
  // Calcular margen de ganancia
  medicationForms.forEach(form => {
    const priceInput = form.querySelector('[name="price"]');
    const profitMarginInput = form.querySelector('[name="profitMargin"]');
    const publicPriceInput = form.querySelector('[name="publicPrice"]');

    // Verificar si los inputs existen antes de agregar los eventos
    if (priceInput && profitMarginInput && publicPriceInput) {
      const calculatePublicPrice = () => {
        const price = parseFloat(priceInput.value) || 0; // Prevenir NaN
        const profitMargin = parseFloat(profitMarginInput.value) || 0; // Prevenir NaN
        const publicPrice = price * (1 + (profitMargin / 100));
        publicPriceInput.value = publicPrice.toFixed(2);
      };

      priceInput.addEventListener('input', calculatePublicPrice);
      profitMarginInput.addEventListener('input', calculatePublicPrice);

      // Calcular el precio público inicial si hay valores predeterminados
      calculatePublicPrice();
    }
  });

  // Manejo de la eliminación
  deleteButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      medicationIdToDelete = event.target.getAttribute('data-id');
      rowToDelete = event.target.closest('tr');
      modal.style.display = 'block';
    });
  });

  confirmDeleteButton.addEventListener('click', async () => {
    if (medicationIdToDelete) {
      try {
        const response = await fetch(`/api/medications/${medicationIdToDelete}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          rowToDelete.remove();
          modal.style.display = 'none';
        } else {
          console.error('Error al eliminar el medicamento:', response.statusText);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  });

  cancelDeleteButton.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  closeSpan.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  });

  // Manejo de la actualización
  const updateForms = document.querySelectorAll('.update-medication-form');
  updateForms.forEach(form => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      const id = event.target.action.split('/').pop().split('?')[0];
      try {
        const response = await fetch(`/api/medications/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          updateModal.style.display = 'block';
        } else {
          console.error('Error al actualizar el medicamento');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    });
  });

  confirmUpdateButton.addEventListener('click', () => {
    updateModal.style.display = 'none';
    window.location.reload(); // Recarga la página para mostrar los cambios
  });

  closeUpdateSpan.addEventListener('click', () => {
    updateModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target == updateModal) {
      updateModal.style.display = 'none';
    }
  });
});
