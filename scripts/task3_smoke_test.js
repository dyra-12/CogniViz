import puppeteer from 'puppeteer';

(async () => {
  const url = 'http://localhost:5173/task3';
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    // Ensure app thinks we're on task3 by setting taskProgress in localStorage before load
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('taskProgress', JSON.stringify({ current: 3, completed: [1,2] }));
    });

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for FlightBooking title to appear
    await page.waitForSelector('h3');

    // Helper to click Select inside a section by title text
    const clickSelectInSection = async (sectionTitle) => {
      return page.evaluate((sectionTitle) => {
        const headers = Array.from(document.querySelectorAll('h3'));
        const header = headers.find(h => h.innerText && h.innerText.includes(sectionTitle));
        if (!header) return false;
        const container = header.closest('div');
        if (!container) return false;
        const btn = Array.from(container.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim().startsWith('Select'));
        if (!btn) return false;
        btn.click();
        return true;
      }, sectionTitle);
    };

    // Select outbound
    const outboundClicked = await clickSelectInSection('Outbound Flight');
    await page.waitForTimeout(400);

    // Select return
    const returnClicked = await clickSelectInSection('Return Flight');
    await page.waitForTimeout(400);

    // Select first available hotel (button text 'Select')
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const hotelHeader = headers.find(h => h.innerText && h.innerText.toLowerCase().includes('hotel'));
      if (!hotelHeader) return false;
      const container = hotelHeader.closest('div');
      const btn = Array.from(container.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim().startsWith('Select') && !b.disabled);
      if (!btn) return false;
      btn.click();
      return true;
    });
    await page.waitForTimeout(400);

    // Select first transport option
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const transHeader = headers.find(h => h.innerText && h.innerText.toLowerCase().includes('transport'));
      if (!transHeader) return false;
      const container = transHeader.closest('div');
      const option = container.querySelector('div[role]') || container.querySelector('div');
      // find clickable option card
      const cards = Array.from(container.querySelectorAll('div')).filter(d => d.onclick || d.getAttribute('role') || d.querySelector('h4'));
      if (!cards || cards.length === 0) return false;
      cards[0].click();
      return true;
    });
    await page.waitForTimeout(400);

    // Meeting drag & drop: find a draggable meeting and drop onto a free time slot
    const didDragDrop = await page.evaluate(() => {
      const draggable = document.querySelector('[draggable]');
      if (!draggable) return false;
      // Find a timeslot element that contains a time like '9:00' and is empty (no draggable child)
      const slots = Array.from(document.querySelectorAll('div'))
        .filter(d => d.innerText && /\d{1,2}:00/.test(d.innerText) && !d.querySelector('[draggable]'));
      if (!slots || slots.length === 0) return false;
      const target = slots[0];

      const dt = new DataTransfer();
      // dispatch dragstart on draggable
      const dragStartEvent = new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt });
      draggable.dispatchEvent(dragStartEvent);
      // dispatch drop on target
      const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
      target.dispatchEvent(dropEvent);
      // dispatch dragend
      const dragEndEvent = new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt });
      draggable.dispatchEvent(dragEndEvent);
      return true;
    });

    await page.waitForTimeout(500);

    // Click Finalize button (text 'Finalize Trip' within a button)
    const finalizeClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Finalize'));
      if (!btn) return false;
      btn.click();
      return true;
    });

    await page.waitForTimeout(1000);

    // Read localStorage key for task3
    const storage = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const k = keys.find(x => x.startsWith('task3_metrics_'));
      if (!k) return { key: null, value: null, allKeys: keys };
      return { key: k, value: localStorage.getItem(k), allKeys: keys };
    });

    console.log('outboundClicked', outboundClicked, 'returnClicked', returnClicked, 'didDragDrop', didDragDrop, 'finalizeClicked', finalizeClicked);
    console.log('localStorageKey', storage.key);
    if (storage.value) {
      // pretty print parsed JSON length
      try {
        const parsed = JSON.parse(storage.value);
        console.log('metrics snapshot:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('raw value:', storage.value);
      }
    } else {
      console.log('No task3 metrics found. All keys:', storage.allKeys);
    }

  } catch (err) {
    console.error('Smoke test failed:', err);
    await browser.close();
    process.exit(2);
  }

  await browser.close();
  process.exit(0);
})();
