
window.addEventListener('DOMContentLoaded', () => {
    console.log('JS carregou ✅');


    document.querySelectorAll('[data-carousel]').forEach((carousel) => {
        const track = carousel.querySelector('[data-track]');
        const slides = [...carousel.querySelectorAll('.carousel__slide')];
        const prev = carousel.querySelector('[data-prev]');
        const next = carousel.querySelector('[data-next]');
        const dotsWrap = carousel.querySelector('[data-dots]');

        // Garantias mínimas para não quebrar
        if (!track || slides.length === 0 || !dotsWrap) {
            console.warn('Carrossel ignorado: seletores obrigatórios ausentes.');
            return;
        }

        let index = 0;

        // Cria dots de navegação
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            if (i === 0) dot.classList.add('is-active');
            dot.addEventListener('click', () => goTo(i));
            dotsWrap.appendChild(dot);
        });
        const dots = [...dotsWrap.children];

        function goTo(i) {
            index = (i + slides.length) % slides.length;
            track.style.transform = `translateX(-${index * 100}%)`;
            slides.forEach((s, si) => s.classList.toggle('is-active', si === index));
            dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
        }

        // Inicia na posição 0
        goTo(0);

        // Navegação pelos botões (se existirem)
        if (prev) prev.addEventListener('click', () => goTo(index - 1));
        if (next) next.addEventListener('click', () => goTo(index + 1));

        // Autoplay seguro (pausa ao passar o mouse)
        let timer = setInterval(() => goTo(index + 1), 5000);
        carousel.addEventListener('mouseenter', () => { clearInterval(timer); timer = null; });
        carousel.addEventListener('mouseleave', () => {
            if (!timer) timer = setInterval(() => goTo(index + 1), 5000);
        });
    });

    // ===== BUSCA DE PRODUTOS NO HEADER =====
    (() => {
        const form = document.querySelector('.search');
        if (!form) return;

        const input = form.querySelector('input');
        const status = document.getElementById('searchStatus');
        const cards = document.querySelectorAll('.products .card');

        // normaliza (remove acentos e deixa minúsculo)
        const norm = (s = '') => s.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        function runSearch() {
            const q = norm(input.value.trim());
            let shown = 0;

            cards.forEach(card => {
                const title = card.querySelector('.card__title')?.textContent || '';
                const text = card.querySelector('.card__text')?.textContent || '';
                const hay = norm(`${title} ${text}`);

                const match = q === '' || hay.includes(q);
                card.style.display = match ? '' : 'none';
                if (match) shown++;
            });

            if (status) {
                if (q === '') status.textContent = '';
                else status.textContent = shown > 0
                    ? `${shown} produto(s) encontrado(s) para “${input.value.trim()}”.`
                    : `Nenhum produto encontrado para “${input.value.trim()}”.`;
            }

            // leva o usuário até a seção de produtos
            document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
        }

        // submit do botão
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            runSearch();
        });

        // busca ao digitar (um pouquinho depois)
        input.addEventListener('input', debounce(runSearch, 200));

        // utilidade: debounce
        function debounce(fn, ms = 200) {
            let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
        }
    })();



    // ==============================
    // MENU MOBILE (☰ ↔ ✖)
    // ==============================
    const btn = document.querySelector('.nav__toggle');
    const menu = document.getElementById('menu');

    if (btn && menu) {
        btn.addEventListener('click', () => {
            const aberto = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!aberto));
            menu.classList.toggle('nav__list--open');
            btn.textContent = aberto ? '☰' : '✖';
        });
    } else {
        console.warn('Menu mobile: .nav__toggle ou #menu não encontrados.');
    }

    // ===== FORMULÁRIO WHATSAPP (assinar novidades) =====
    (() => {
        const PADARIA_WA = '5543984363756'; // << coloque AQUI o número da padaria (55 + DDD + número)

        const form = document.querySelector('.form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const input = form.querySelector('input');
            let numero = (input.value || '').trim();

            if (!numero) {
                alert('Por favor, digite seu número com DDD.');
                return;
            }

            // Só para validar/limpar (mantém dígitos)
            const limpo = numero.replace(/\D/g, '');
            if (limpo.length < 10) {
                alert('Número inválido. Use DDD + número, ex.: 43998431234');
                return;
            }

            // Mensagem que a PADOCA vai receber
            const msg = `Olá! Quero receber novidades da Padaria Pão do Nono 🥖
            
(Autorizo o contato pelo WhatsApp).`;

            // Agora abrimos o chat da padaria, NÃO o do usuário
            const url = `https://wa.me/${PADARIA_WA}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');

            input.value = '';
        });
    })();


    // ==============================
    // SCROLL SUAVE (links internos)
    // ==============================
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const alvo = document.querySelector(link.getAttribute('href'));
            if (alvo) {
                e.preventDefault();
                alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});


// ====== Carrinho -> WhatsApp ======
(() => {
    const WHATSAPP_NUMBER = '5543999999999'; // << coloque seu número com DDI 55 + DDD

    const $ = (sel, el = document) => el.querySelector(sel);
    const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

    const cartBtn = $('#cartBtn');
    const cart = $('#cart');
    const cartClose = $('#cartClose');
    const cartOverlay = $('#cartOverlay');
    const cartList = $('#cartList');
    const cartCount = $('#cartCount');
    const cartTotal = $('#cartTotal');
    const cartClear = $('#cartClear');
    const cartCheckout = $('#cartCheckout');

    let items = [];

    // utilidades
    const money = v => (v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function openCart() { cart.classList.add('is-open'); cartOverlay.hidden = false; cart.setAttribute('aria-hidden', 'false'); }
    function closeCart() { cart.classList.remove('is-open'); cartOverlay.hidden = true; cart.setAttribute('aria-hidden', 'true'); }

    function addItem(name, price) {
        const p = Number(price || 0);
        const i = items.findIndex(x => x.name === name && x.price === p);
        if (i >= 0) items[i].qty += 1;
        else items.push({ name, price: p, qty: 1 });
        render();
    }
    function removeItem(idx) { items.splice(idx, 1); render(); }
    function setQty(idx, q) { items[idx].qty = Math.max(1, q); render(); }

    function render() {
        // lista
        cartList.innerHTML = '';
        items.forEach((it, idx) => {
            const li = document.createElement('li');
            li.className = 'cart__item';
            li.innerHTML = `
        <div><strong>${it.name}</strong><br><small>R$ ${money(it.price)}</small></div>
        <div class="cart__qty">
          <button aria-label="Diminuir" onclick="this.nextElementSibling.textContent = Number(this.nextElementSibling.textContent)-1; this.dispatchEvent(new CustomEvent('change-qty',{bubbles:true,detail:{idx}}))">−</button>
          <span>${it.qty}</span>
          <button aria-label="Aumentar" onclick="this.previousElementSibling.textContent = Number(this.previousElementSibling.textContent)+1; this.dispatchEvent(new CustomEvent('change-qty',{bubbles:true,detail:{idx}}))">+</button>
        </div>
        <button class="cart__remove" aria-label="Remover" data-rm="${idx}">Remover</button>
      `;
            cartList.appendChild(li);
        });

        // eventos qty / remover
        cartList.querySelectorAll('[data-rm]').forEach(b => {
            b.addEventListener('click', () => removeItem(Number(b.dataset.rm)));
        });
        cartList.addEventListener('change-qty', e => {
            const { idx } = e.detail;
            const span = e.target.closest('.cart__qty').querySelector('span');
            setQty(idx, Number(span.textContent));
        });

        // contagem e total
        const count = items.reduce((s, i) => s + i.qty, 0);
        const total = items.reduce((s, i) => s + i.qty * i.price, 0);
        cartCount.textContent = count;
        cartTotal.textContent = money(total);
    }

    // abrir/fechar
    cartBtn?.addEventListener('click', openCart);
    cartClose?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);

    // limpar
    cartClear?.addEventListener('click', () => { items = []; render(); });

    // finalizar no whatsapp
    cartCheckout?.addEventListener('click', () => {
        if (items.length === 0) return alert('Seu carrinho está vazio.');
        const linhas = items.map(it => `• ${it.qty}x ${it.name} — R$ ${money(it.price)}`);
        const total = items.reduce((s, i) => s + i.qty * i.price, 0);
        const msg =
            `Olá! Quero fazer um pedido 🥖

${linhas.join('\n')}
———————————————
Total: R$ ${money(total)}

Nome: 
Entrega/Retirada: 
Obs: `;

        const url = `https://wa.me/${5543984871345}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    });

    // interceptar cliques nos botões "Adicionar ao carrinho"
    $$('.btn--carrinho').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.product || btn.closest('.card')?.querySelector('.card__title')?.textContent?.trim() || 'Item';
            const price = btn.dataset.price || '0';
            addItem(name, price);
            openCart();
        });
    });

    render(); // inicia
})();
