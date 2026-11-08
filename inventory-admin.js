(function(){
  const categories=[['dog','Dogs'],['cat','Cats'],['bird','Birds'],['fish','Fish'],['rodent','Small pets']];
  function formMarkup(){
    return `<section class="inventory-add-section"><h2>Add a product</h2><form class="inventory-new-product">
      <label>Product name<input name="name" maxlength="190" required></label>
      <label>Category<select name="category" required><option value="">Choose category</option>${categories.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label>
      <label>Product type (optional)<input name="subcategory" maxlength="80" placeholder="Food &amp; Treats"></label>
      <label>Price (₱)<input name="price" type="number" min="0.01" step="0.01" required></label>
      <label>Initial stock<input name="stock" type="number" min="0" max="1000000" step="1" value="0" required></label>
      <label>Product image (JPG, PNG, or WEBP)<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required></label>
      <button type="submit">Add product</button><span class="inventory-save-status" aria-live="polite"></span>
    </form></section>`;
  }

  function imageData(file){
    return new Promise((resolve,reject)=>{
      if(!file || !/^image\/(jpeg|png|webp)$/.test(file.type)){reject(Error('Choose a JPG, PNG, or WEBP image.'));return}
      if(file.size>8*1024*1024){reject(Error('Choose an image smaller than 8 MB.'));return}
      const reader=new FileReader();
      reader.onerror=()=>reject(Error('Could not read the selected product image.'));
      reader.onload=()=>{
        const image=new Image();
        image.onerror=()=>reject(Error('Please choose a valid product image.'));
        image.onload=()=>{
          const scale=Math.min(1,1400/Math.max(image.width,image.height));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(image.width*scale));
          canvas.height=Math.max(1,Math.round(image.height*scale));
          canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
          let data=canvas.toDataURL('image/jpeg',.84);
          if(data.length>4*1024*1024)data=canvas.toDataURL('image/jpeg',.68);
          if(data.length>4*1024*1024){reject(Error('The image could not be compressed enough. Choose a smaller image.'));return}
          resolve(data);
        };
        image.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function wireCreate(container,api,reload){
    const form=container.querySelector('.inventory-new-product');
    if(!form)return;
    form.onsubmit=async event=>{
      event.preventDefault();
      const button=form.querySelector('button'),status=form.querySelector('.inventory-save-status'),data=new FormData(form);
      button.disabled=true;status.textContent='Uploading image and saving product...';
      try{
        const image=await imageData(data.get('image'));
        await api('api/products.php',{method:'POST',body:JSON.stringify({
          name:String(data.get('name')).trim(),category:data.get('category'),
          subcategory:String(data.get('subcategory')||'').trim(),price:Number(data.get('price')),
          stock:Number(data.get('stock')),image_data:image
        })});
        await reload();
      }catch(error){status.textContent=error.message;button.disabled=false}
    };
  }

  window.PawCareInventory={formMarkup,wireCreate};
})();
