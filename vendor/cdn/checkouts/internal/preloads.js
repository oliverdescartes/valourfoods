
    (function() {
      var cdnOrigin = "https://cdn.shopify.com";
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills.CgsWKOqO.js","/cdn/shopifycloud/checkout-web/assets/c1/app.BV1dErA5.js","/cdn/shopifycloud/checkout-web/assets/c1/vendor.bdI-yeR3.js","/cdn/shopifycloud/checkout-web/assets/c1/browser.DJv8lLUT.js","/cdn/shopifycloud/checkout-web/assets/c1/FullScreenBackground.DRJfIoKg.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-discount-offer.BKHg5aPi.js","/cdn/shopifycloud/checkout-web/assets/c1/alternativePaymentCurrency.CCVxQV6l.js","/cdn/shopifycloud/checkout-web/assets/c1/proposal.DSHwCQTA.js","/cdn/shopifycloud/checkout-web/assets/c1/ButtonWithRegisterWebPixel.CxPk0Xu8.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-en.CGBNH2md.js","/cdn/shopifycloud/checkout-web/assets/c1/page-OnePage.BnLGLxfK.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentButtons.DnuAjCS3.js","/cdn/shopifycloud/checkout-web/assets/c1/LocalPickup.7d_0AqQs.js","/cdn/shopifycloud/checkout-web/assets/c1/NoAddressLocationFullDetour.BKYrJngV.js","/cdn/shopifycloud/checkout-web/assets/c1/OffsitePaymentFailed.DMo0pdv0.js","/cdn/shopifycloud/checkout-web/assets/c1/useForceShopPayUrl.CE6E9KIF.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayLogo.Bu6Anib3.js","/cdn/shopifycloud/checkout-web/assets/c1/VaultedPayment.DlBE1w0_.js","/cdn/shopifycloud/checkout-web/assets/c1/MarketsProDisclaimer.CcRaSssW.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingGroupsSummary.72Uvc6Wf.js","/cdn/shopifycloud/checkout-web/assets/c1/StackedMerchandisePreview.BzI_bRGl.js","/cdn/shopifycloud/checkout-web/assets/c1/PickupPointCarrierLogo.CbArtW9V.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks.DacpQOqW.js","/cdn/shopifycloud/checkout-web/assets/c1/AddDiscountButton.B6Gv-j57.js","/cdn/shopifycloud/checkout-web/assets/c1/RememberMeDescriptionText.BCkFq7Qn.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayOptInDisclaimer.6kQABmsQ.js","/cdn/shopifycloud/checkout-web/assets/c1/MobileOrderSummary.D2usxbcV.js","/cdn/shopifycloud/checkout-web/assets/c1/OrderEditVaultedDelivery.az3QlWk5.js","/cdn/shopifycloud/checkout-web/assets/c1/SeparatePaymentsNotice.3yv8czMK.js","/cdn/shopifycloud/checkout-web/assets/c1/useHasOrdersFromMultipleShops.BDY70Vfp.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblemsLineItemList.BRAl6f1f.js","/cdn/shopifycloud/checkout-web/assets/c1/flags.CoLd-yVz.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown.Bw35mcK1.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal.C5Hu0EPt.js","/cdn/shopifycloud/checkout-web/assets/c1/shipping-options.CksJIZLR.js","/cdn/shopifycloud/checkout-web/assets/c1/DutyOptions.D3W9xR-2.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodSelector.D4QoVWhJ.js","/cdn/shopifycloud/checkout-web/assets/c1/SubscriptionPriceBreakdown.DlUEA24V.js"];
      var styles = ["/cdn/shopifycloud/checkout-web/assets/c1/assets/app.D7EkV1ZR.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/FullScreenBackground.B_iZlQze.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ButtonWithRegisterWebPixel.C255G1T7.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OnePage.CKTqepKH.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/LocalPickup.BhtheElV.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/AddDiscountButton.CZ33y7Va.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/MobileOrderSummary.7lB-c-sA.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShopPayLogo.BrcQzLuH.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/NoAddressLocationFullDetour.D14orovx.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/DutyOptions.LcqrKXE1.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/VaultedPayment.OxMVm7u-.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PickupPointCarrierLogo.DuZuWHqZ.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OffsitePaymentFailed.BxwwfmsJ.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/StackedMerchandisePreview.D6OuIVjc.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShippingMethodSelector.B0hio2RO.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/SubscriptionPriceBreakdown.BSemv9tH.css"];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = [];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = [cdnOrigin].concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  