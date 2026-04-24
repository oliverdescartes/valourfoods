/*!
 * ScrollTrigger 3.12.2
 * https://greensock.com
 *
 * @license Copyright 2023, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
 */ (function (e, t) {
  typeof exports == "object" && typeof module != "undefined"
    ? t(exports)
    : typeof define == "function" && define.amd
      ? define(["exports"], t)
      : t(((e = e || self).window = e.window || {}));
})(this, function (e) {
  "use strict";
  function _defineProperties(e2, t2) {
    for (var r2 = 0; r2 < t2.length; r2++) {
      var n2 = t2[r2];
      ((n2.enumerable = n2.enumerable || !1),
        (n2.configurable = !0),
        "value" in n2 && (n2.writable = !0),
        Object.defineProperty(e2, n2.key, n2));
    }
  }
  function r() {
    return (
      Se ||
      (typeof window != "undefined" &&
        (Se = window.gsap) &&
        Se.registerPlugin &&
        Se)
    );
  }
  function z(e2, t2) {
    return ~Ie.indexOf(e2) && Ie[Ie.indexOf(e2) + 1][t2];
  }
  function A(e2) {
    return !!~t.indexOf(e2);
  }
  function B(e2, t2, r2, n2, o2) {
    return e2.addEventListener(t2, r2, { passive: !n2, capture: !!o2 });
  }
  function C(e2, t2, r2, n2) {
    return e2.removeEventListener(t2, r2, !!n2);
  }
  function F() {
    return (Re && Re.isPressed) || ze.cache++;
  }
  function G(r2, n2) {
    function ad(e2) {
      if (e2 || e2 === 0) {
        o && (Te.history.scrollRestoration = "manual");
        var t2 = Re && Re.isPressed;
        ((e2 = ad.v = Math.round(e2) || (Re && Re.iOS ? 1 : 0)),
          r2(e2),
          (ad.cacheID = ze.cache),
          t2 && i("ss", e2));
      } else
        (n2 || ze.cache !== ad.cacheID || i("ref")) &&
          ((ad.cacheID = ze.cache), (ad.v = r2()));
      return ad.v + ad.offset;
    }
    return ((ad.offset = 0), r2 && ad);
  }
  function J(e2, t2) {
    return (
      ((t2 && t2._ctx && t2._ctx.selector) || Se.utils.toArray)(e2)[0] ||
      (typeof e2 == "string" && Se.config().nullTargetWarn !== !1
        ? console.warn("Element not found:", e2)
        : null)
    );
  }
  function K(t2, e2) {
    var r2 = e2.s,
      n2 = e2.sc;
    A(t2) && (t2 = Ce.scrollingElement || Pe);
    var o2 = ze.indexOf(t2),
      i2 = n2 === He.sc ? 1 : 2;
    (~o2 || (o2 = ze.push(t2) - 1), ze[o2 + i2] || B(t2, "scroll", F));
    var a2 = ze[o2 + i2],
      s2 =
        a2 ||
        (ze[o2 + i2] =
          G(z(t2, r2), !0) ||
          (A(t2)
            ? n2
            : G(function (e3) {
                return arguments.length ? (t2[r2] = e3) : t2[r2];
              })));
    return (
      (s2.target = t2),
      a2 || (s2.smooth = Se.getProperty(t2, "scrollBehavior") === "smooth"),
      s2
    );
  }
  function L(e2, t2, o2) {
    function zd(e3, t3) {
      var r2 = Ye();
      t3 || n2 < r2 - s2
        ? ((a2 = i2), (i2 = e3), (l2 = s2), (s2 = r2))
        : o2
          ? (i2 += e3)
          : (i2 = a2 + ((e3 - a2) / (r2 - l2)) * (s2 - l2));
    }
    var i2 = e2,
      a2 = e2,
      s2 = Ye(),
      l2 = s2,
      n2 = t2 || 50,
      c2 = Math.max(500, 3 * n2);
    return {
      update: zd,
      reset: function () {
        ((a2 = i2 = o2 ? 0 : i2), (l2 = s2 = 0));
      },
      getVelocity: function (e3) {
        var t3 = l2,
          r2 = a2,
          n3 = Ye();
        return (
          (!e3 && e3 !== 0) || e3 === i2 || zd(e3),
          s2 === l2 || c2 < n3 - l2
            ? 0
            : ((i2 + (o2 ? r2 : -r2)) / ((o2 ? n3 : s2) - t3)) * 1e3
        );
      },
    };
  }
  function M(e2, t2) {
    return (
      t2 && !e2._gsapAllow && e2.preventDefault(),
      e2.changedTouches ? e2.changedTouches[0] : e2
    );
  }
  function N(e2) {
    var t2 = Math.max.apply(Math, e2),
      r2 = Math.min.apply(Math, e2);
    return Math.abs(t2) >= Math.abs(r2) ? t2 : r2;
  }
  function O() {
    (Ae = Se.core.globals().ScrollTrigger) &&
      Ae.core &&
      (function () {
        var e2 = Ae.core,
          r2 = e2.bridge || {},
          t2 = e2._scrollers,
          n2 = e2._proxies;
        (t2.push.apply(t2, ze),
          n2.push.apply(n2, Ie),
          (ze = t2),
          (Ie = n2),
          (i = function (e3, t3) {
            return r2[e3](t3);
          }));
      })();
  }
  function P(e2) {
    return (
      (Se = e2 || r()) &&
        typeof document != "undefined" &&
        document.body &&
        ((Te = window),
        (Pe = (Ce = document).documentElement),
        (Me = Ce.body),
        (t = [Te, Ce, Pe, Me]),
        Se.utils.clamp,
        (De = Se.core.context || function () {}),
        (Oe = "onpointerenter" in Me ? "pointer" : "mouse"),
        (Ee = E.isTouch =
          Te.matchMedia &&
          Te.matchMedia("(hover: none), (pointer: coarse)").matches
            ? 1
            : "ontouchstart" in Te ||
                0 < navigator.maxTouchPoints ||
                0 < navigator.msMaxTouchPoints
              ? 2
              : 0),
        (Be = E.eventTypes =
          (
            "ontouchstart" in Pe
              ? "touchstart,touchmove,touchcancel,touchend"
              : "onpointerdown" in Pe
                ? "pointerdown,pointermove,pointercancel,pointerup"
                : "mousedown,mousemove,mouseup,mouseup"
          ).split(",")),
        setTimeout(function () {
          return (o = 0);
        }, 500),
        O(),
        (ke = 1)),
      ke
    );
  }
  var Se,
    ke,
    Te,
    Ce,
    Pe,
    Me,
    Ee,
    Oe,
    Ae,
    t,
    Re,
    Be,
    De,
    o = 1,
    Fe = [],
    ze = [],
    Ie = [],
    Ye = Date.now,
    i = function (e2, t2) {
      return t2;
    },
    n = "scrollLeft",
    a = "scrollTop",
    qe = {
      s: n,
      p: "left",
      p2: "Left",
      os: "right",
      os2: "Right",
      d: "width",
      d2: "Width",
      a: "x",
      sc: G(function (e2) {
        return arguments.length
          ? Te.scrollTo(e2, He.sc())
          : Te.pageXOffset || Ce[n] || Pe[n] || Me[n] || 0;
      }),
    },
    He = {
      s: a,
      p: "top",
      p2: "Top",
      os: "bottom",
      os2: "Bottom",
      d: "height",
      d2: "Height",
      a: "y",
      op: qe,
      sc: G(function (e2) {
        return arguments.length
          ? Te.scrollTo(qe.sc(), e2)
          : Te.pageYOffset || Ce[a] || Pe[a] || Me[a] || 0;
      }),
    };
  ((qe.op = He), (ze.cache = 0));
  var E =
    ((Observer.prototype.init = function (e2) {
      (ke || P(Se) || console.warn("Please gsap.registerPlugin(Observer)"),
        Ae || O());
      var o2 = e2.tolerance,
        a2 = e2.dragMinimum,
        t2 = e2.type,
        i2 = e2.target,
        r2 = e2.lineHeight,
        n2 = e2.debounce,
        s2 = e2.preventDefault,
        l2 = e2.onStop,
        c2 = e2.onStopDelay,
        u2 = e2.ignore,
        f2 = e2.wheelSpeed,
        d2 = e2.event,
        p2 = e2.onDragStart,
        g2 = e2.onDragEnd,
        h2 = e2.onDrag,
        v2 = e2.onPress,
        b2 = e2.onRelease,
        m2 = e2.onRight,
        y2 = e2.onLeft,
        x2 = e2.onUp,
        _2 = e2.onDown,
        w2 = e2.onChangeX,
        S2 = e2.onChangeY,
        k2 = e2.onChange,
        T2 = e2.onToggleX,
        E2 = e2.onToggleY,
        R2 = e2.onHover,
        D2 = e2.onHoverEnd,
        z2 = e2.onMove,
        I2 = e2.ignoreCheck,
        Y2 = e2.isNormalizer,
        q2 = e2.onGestureStart,
        H2 = e2.onGestureEnd,
        X2 = e2.onWheel,
        W2 = e2.onEnable,
        G2 = e2.onDisable,
        V2 = e2.onClick,
        U2 = e2.scrollSpeed,
        j2 = e2.capture,
        Q2 = e2.allowClicks,
        $2 = e2.lockAxis,
        Z2 = e2.onLockAxis;
      function $e() {
        return (ye = Ye());
      }
      function _e(e3, t3) {
        return (
          ((se.event = e3) && u2 && ~u2.indexOf(e3.target)) ||
          (t3 && ge && e3.pointerType !== "touch") ||
          (I2 && I2(e3, t3))
        );
      }
      function bf() {
        var e3 = (se.deltaX = N(be)),
          t3 = (se.deltaY = N(me)),
          r3 = Math.abs(e3) >= o2,
          n3 = Math.abs(t3) >= o2;
        (k2 && (r3 || n3) && k2(se, e3, t3, be, me),
          r3 &&
            (m2 && 0 < se.deltaX && m2(se),
            y2 && se.deltaX < 0 && y2(se),
            w2 && w2(se),
            T2 && se.deltaX < 0 != le < 0 && T2(se),
            (le = se.deltaX),
            (be[0] = be[1] = be[2] = 0)),
          n3 &&
            (_2 && 0 < se.deltaY && _2(se),
            x2 && se.deltaY < 0 && x2(se),
            S2 && S2(se),
            E2 && se.deltaY < 0 != ce < 0 && E2(se),
            (ce = se.deltaY),
            (me[0] = me[1] = me[2] = 0)),
          (ne2 || re2) &&
            (z2 && z2(se), re2 && (h2(se), (re2 = !1)), (ne2 = !1)),
          ie2 && !(ie2 = !1) && Z2 && Z2(se),
          oe2 && (X2(se), (oe2 = !1)),
          (ee2 = 0));
      }
      function cf(e3, t3, r3) {
        ((be[r3] += e3),
          (me[r3] += t3),
          se._vx.update(e3),
          se._vy.update(t3),
          n2 ? (ee2 = ee2 || requestAnimationFrame(bf)) : bf());
      }
      function df(e3, t3) {
        ($2 &&
          !ae2 &&
          ((se.axis = ae2 = Math.abs(e3) > Math.abs(t3) ? "x" : "y"),
          (ie2 = !0)),
          ae2 !== "y" && ((be[2] += e3), se._vx.update(e3, !0)),
          ae2 !== "x" && ((me[2] += t3), se._vy.update(t3, !0)),
          n2 ? (ee2 = ee2 || requestAnimationFrame(bf)) : bf());
      }
      function ef(e3) {
        if (!_e(e3, 1)) {
          var t3 = (e3 = M(e3, s2)).clientX,
            r3 = e3.clientY,
            n3 = t3 - se.x,
            o3 = r3 - se.y,
            i3 = se.isDragging;
          ((se.x = t3),
            (se.y = r3),
            (i3 ||
              Math.abs(se.startX - t3) >= a2 ||
              Math.abs(se.startY - r3) >= a2) &&
              (h2 && (re2 = !0),
              i3 || (se.isDragging = !0),
              df(n3, o3),
              i3 || (p2 && p2(se))));
        }
      }
      function hf(e3) {
        return (
          e3.touches &&
          1 < e3.touches.length &&
          (se.isGesturing = !0) &&
          q2(e3, se.isDragging)
        );
      }
      function jf() {
        return (se.isGesturing = !1) || H2(se);
      }
      function kf(e3) {
        if (!_e(e3)) {
          var t3 = ue(),
            r3 = fe();
          (cf((t3 - de) * U2, (r3 - pe) * U2, 1),
            (de = t3),
            (pe = r3),
            l2 && te2.restart(!0));
        }
      }
      function lf(e3) {
        if (!_e(e3)) {
          ((e3 = M(e3, s2)), X2 && (oe2 = !0));
          var t3 =
            (e3.deltaMode === 1
              ? r2
              : e3.deltaMode === 2
                ? Te.innerHeight
                : 1) * f2;
          (cf(e3.deltaX * t3, e3.deltaY * t3, 0), l2 && !Y2 && te2.restart(!0));
        }
      }
      function mf(e3) {
        if (!_e(e3)) {
          var t3 = e3.clientX,
            r3 = e3.clientY,
            n3 = t3 - se.x,
            o3 = r3 - se.y;
          ((se.x = t3), (se.y = r3), (ne2 = !0), (n3 || o3) && df(n3, o3));
        }
      }
      function nf(e3) {
        ((se.event = e3), R2(se));
      }
      function of(e3) {
        ((se.event = e3), D2(se));
      }
      function pf(e3) {
        return _e(e3) || (M(e3, s2) && V2(se));
      }
      ((this.target = i2 = J(i2) || Pe),
        (this.vars = e2),
        (u2 = u2 && Se.utils.toArray(u2)),
        (o2 = o2 || 1e-9),
        (a2 = a2 || 0),
        (f2 = f2 || 1),
        (U2 = U2 || 1),
        (t2 = t2 || "wheel,touch,pointer"),
        (n2 = n2 !== !1),
        (r2 = r2 || parseFloat(Te.getComputedStyle(Me).lineHeight) || 22));
      var ee2,
        te2,
        re2,
        ne2,
        oe2,
        ie2,
        ae2,
        se = this,
        le = 0,
        ce = 0,
        ue = K(i2, qe),
        fe = K(i2, He),
        de = ue(),
        pe = fe(),
        ge =
          ~t2.indexOf("touch") &&
          !~t2.indexOf("pointer") &&
          Be[0] === "pointerdown",
        he = A(i2),
        ve = i2.ownerDocument || Ce,
        be = [0, 0, 0],
        me = [0, 0, 0],
        ye = 0,
        xe = (se.onPress = function (e3) {
          _e(e3, 1) ||
            (e3 && e3.button) ||
            ((se.axis = ae2 = null),
            te2.pause(),
            (se.isPressed = !0),
            (e3 = M(e3)),
            (le = ce = 0),
            (se.startX = se.x = e3.clientX),
            (se.startY = se.y = e3.clientY),
            se._vx.reset(),
            se._vy.reset(),
            B(Y2 ? i2 : ve, Be[1], ef, s2, !0),
            (se.deltaX = se.deltaY = 0),
            v2 && v2(se));
        }),
        we = (se.onRelease = function (t3) {
          if (!_e(t3, 1)) {
            C(Y2 ? i2 : ve, Be[1], ef, !0);
            var e3 = !isNaN(se.y - se.startY),
              r3 =
                se.isDragging &&
                (3 < Math.abs(se.x - se.startX) ||
                  3 < Math.abs(se.y - se.startY)),
              n3 = M(t3);
            (!r3 &&
              e3 &&
              (se._vx.reset(),
              se._vy.reset(),
              s2 &&
                Q2 &&
                Se.delayedCall(0.08, function () {
                  if (300 < Ye() - ye && !t3.defaultPrevented) {
                    if (t3.target.click) t3.target.click();
                    else if (ve.createEvent) {
                      var e4 = ve.createEvent("MouseEvents");
                      (e4.initMouseEvent(
                        "click",
                        !0,
                        !0,
                        Te,
                        1,
                        n3.screenX,
                        n3.screenY,
                        n3.clientX,
                        n3.clientY,
                        !1,
                        !1,
                        !1,
                        !1,
                        0,
                        null,
                      ),
                        t3.target.dispatchEvent(e4));
                    }
                  }
                })),
              (se.isDragging = se.isGesturing = se.isPressed = !1),
              l2 && !Y2 && te2.restart(!0),
              g2 && r3 && g2(se),
              b2 && b2(se, r3));
          }
        });
      ((te2 = se._dc =
        Se.delayedCall(c2 || 0.25, function () {
          (se._vx.reset(), se._vy.reset(), te2.pause(), l2 && l2(se));
        }).pause()),
        (se.deltaX = se.deltaY = 0),
        (se._vx = L(0, 50, !0)),
        (se._vy = L(0, 50, !0)),
        (se.scrollX = ue),
        (se.scrollY = fe),
        (se.isDragging = se.isGesturing = se.isPressed = !1),
        De(this),
        (se.enable = function (e3) {
          return (
            se.isEnabled ||
              (B(he ? ve : i2, "scroll", F),
              0 <= t2.indexOf("scroll") &&
                B(he ? ve : i2, "scroll", kf, s2, j2),
              0 <= t2.indexOf("wheel") && B(i2, "wheel", lf, s2, j2),
              ((0 <= t2.indexOf("touch") && Ee) ||
                0 <= t2.indexOf("pointer")) &&
                (B(i2, Be[0], xe, s2, j2),
                B(ve, Be[2], we),
                B(ve, Be[3], we),
                Q2 && B(i2, "click", $e, !1, !0),
                V2 && B(i2, "click", pf),
                q2 && B(ve, "gesturestart", hf),
                H2 && B(ve, "gestureend", jf),
                R2 && B(i2, Oe + "enter", nf),
                D2 && B(i2, Oe + "leave", of),
                z2 && B(i2, Oe + "move", mf)),
              (se.isEnabled = !0),
              e3 && e3.type && xe(e3),
              W2 && W2(se)),
            se
          );
        }),
        (se.disable = function () {
          se.isEnabled &&
            (Fe.filter(function (e3) {
              return e3 !== se && A(e3.target);
            }).length || C(he ? ve : i2, "scroll", F),
            se.isPressed &&
              (se._vx.reset(), se._vy.reset(), C(Y2 ? i2 : ve, Be[1], ef, !0)),
            C(he ? ve : i2, "scroll", kf, j2),
            C(i2, "wheel", lf, j2),
            C(i2, Be[0], xe, j2),
            C(ve, Be[2], we),
            C(ve, Be[3], we),
            C(i2, "click", $e, !0),
            C(i2, "click", pf),
            C(ve, "gesturestart", hf),
            C(ve, "gestureend", jf),
            C(i2, Oe + "enter", nf),
            C(i2, Oe + "leave", of),
            C(i2, Oe + "move", mf),
            (se.isEnabled = se.isPressed = se.isDragging = !1),
            G2 && G2(se));
        }),
        (se.kill = se.revert =
          function () {
            se.disable();
            var e3 = Fe.indexOf(se);
            (0 <= e3 && Fe.splice(e3, 1), Re === se && (Re = 0));
          }),
        Fe.push(se),
        Y2 && A(i2) && (Re = se),
        se.enable(d2));
    }),
    (function (e2, t2, r2) {
      return (
        t2 && _defineProperties(e2.prototype, t2),
        r2 && _defineProperties(e2, r2),
        e2
      );
    })(Observer, [
      {
        key: "velocityX",
        get: function () {
          return this._vx.getVelocity();
        },
      },
      {
        key: "velocityY",
        get: function () {
          return this._vy.getVelocity();
        },
      },
    ]),
    Observer);
  function Observer(e2) {
    this.init(e2);
  }
  ((E.version = "3.12.2"),
    (E.create = function (e2) {
      return new E(e2);
    }),
    (E.register = P),
    (E.getAll = function () {
      return Fe.slice();
    }),
    (E.getById = function (t2) {
      return Fe.filter(function (e2) {
        return e2.vars.id === t2;
      })[0];
    }),
    r() && Se.registerPlugin(E));
  function Aa(e2, t2, r2) {
    var n2 = ct(e2) && (e2.substr(0, 6) === "clamp(" || -1 < e2.indexOf("max"));
    return (r2["_" + t2 + "Clamp"] = n2) ? e2.substr(6, e2.length - 7) : e2;
  }
  function Ba(e2, t2) {
    return !t2 || (ct(e2) && e2.substr(0, 6) === "clamp(")
      ? e2
      : "clamp(" + e2 + ")";
  }
  function Da() {
    return (Ke = 1);
  }
  function Ea() {
    return (Ke = 0);
  }
  function Fa(e2) {
    return e2;
  }
  function Ga(e2) {
    return Math.round(1e5 * e2) / 1e5 || 0;
  }
  function Ha() {
    return typeof window != "undefined";
  }
  function Ia() {
    return Le || (Ha() && (Le = window.gsap) && Le.registerPlugin && Le);
  }
  function Ja(e2) {
    return !!~l.indexOf(e2);
  }
  function Ka(e2) {
    return (
      (e2 === "Height" ? S : Ne["inner" + e2]) ||
      Je["client" + e2] ||
      We["client" + e2]
    );
  }
  function La(e2) {
    return (
      z(e2, "getBoundingClientRect") ||
      (Ja(e2)
        ? function () {
            return ((Ot.width = Ne.innerWidth), (Ot.height = S), Ot);
          }
        : function () {
            return _t(e2);
          })
    );
  }
  function Oa(e2, t2) {
    var r2 = t2.s,
      n2 = t2.d2,
      o2 = t2.d,
      i2 = t2.a;
    return Math.max(
      0,
      (r2 = "scroll" + n2) && (i2 = z(e2, r2))
        ? i2() - La(e2)()[o2]
        : Ja(e2)
          ? (Je[r2] || We[r2]) - Ka(n2)
          : e2[r2] - e2["offset" + n2],
    );
  }
  function Pa(e2, t2) {
    for (var r2 = 0; r2 < g.length; r2 += 3)
      (t2 && !~t2.indexOf(g[r2 + 1])) || e2(g[r2], g[r2 + 1], g[r2 + 2]);
  }
  function Ra(e2) {
    return typeof e2 == "function";
  }
  function Sa(e2) {
    return typeof e2 == "number";
  }
  function Ta(e2) {
    return typeof e2 == "object";
  }
  function Ua(e2, t2, r2) {
    return e2 && e2.progress(t2 ? 0 : 1) && r2 && e2.pause();
  }
  function Va(e2, t2) {
    if (e2.enabled) {
      var r2 = t2(e2);
      r2 && r2.totalTime && (e2.callbackAnimation = r2);
    }
  }
  function kb(e2) {
    return Ne.getComputedStyle(e2);
  }
  function mb(e2, t2) {
    for (var r2 in t2) r2 in e2 || (e2[r2] = t2[r2]);
    return e2;
  }
  function ob(e2, t2) {
    var r2 = t2.d2;
    return e2["offset" + r2] || e2["client" + r2] || 0;
  }
  function pb(e2) {
    var t2,
      r2 = [],
      n2 = e2.labels,
      o2 = e2.duration();
    for (t2 in n2) r2.push(n2[t2] / o2);
    return r2;
  }
  function rb(o2) {
    var i2 = Le.utils.snap(o2),
      a2 =
        Array.isArray(o2) &&
        o2.slice(0).sort(function (e2, t2) {
          return e2 - t2;
        });
    return a2
      ? function (e2, t2, r2) {
          var n2;
          if ((r2 === void 0 && (r2 = 0.001), !t2)) return i2(e2);
          if (0 < t2) {
            for (e2 -= r2, n2 = 0; n2 < a2.length; n2++)
              if (a2[n2] >= e2) return a2[n2];
            return a2[n2 - 1];
          }
          for (n2 = a2.length, e2 += r2; n2--; )
            if (a2[n2] <= e2) return a2[n2];
          return a2[0];
        }
      : function (e2, t2, r2) {
          r2 === void 0 && (r2 = 0.001);
          var n2 = i2(e2);
          return !t2 || Math.abs(n2 - e2) < r2 || n2 - e2 < 0 == t2 < 0
            ? n2
            : i2(t2 < 0 ? e2 - o2 : e2 + o2);
        };
  }
  function tb(t2, r2, e2, n2) {
    return e2.split(",").forEach(function (e3) {
      return t2(r2, e3, n2);
    });
  }
  function ub(e2, t2, r2, n2, o2) {
    return e2.addEventListener(t2, r2, { passive: !n2, capture: !!o2 });
  }
  function vb(e2, t2, r2, n2) {
    return e2.removeEventListener(t2, r2, !!n2);
  }
  function wb(e2, t2, r2) {
    (r2 = r2 && r2.wheelHandler) &&
      (e2(t2, "wheel", r2), e2(t2, "touchmove", r2));
  }
  function Ab(e2, t2) {
    if (ct(e2)) {
      var r2 = e2.indexOf("="),
        n2 = ~r2 ? (e2.charAt(r2 - 1) + 1) * parseFloat(e2.substr(r2 + 1)) : 0;
      (~r2 &&
        (e2.indexOf("%") > r2 && (n2 *= t2 / 100), (e2 = e2.substr(0, r2 - 1))),
        (e2 =
          n2 +
          (e2 in q
            ? q[e2] * t2
            : ~e2.indexOf("%")
              ? (parseFloat(e2) * t2) / 100
              : parseFloat(e2) || 0)));
    }
    return e2;
  }
  function Bb(e2, t2, r2, n2, o2, i2, a2, s2) {
    var l2 = o2.startColor,
      c2 = o2.endColor,
      u2 = o2.fontSize,
      f2 = o2.indent,
      d2 = o2.fontWeight,
      p2 = Xe.createElement("div"),
      g2 = Ja(r2) || z(r2, "pinType") === "fixed",
      h2 = e2.indexOf("scroller") !== -1,
      v2 = g2 ? We : r2,
      b2 = e2.indexOf("start") !== -1,
      m2 = b2 ? l2 : c2,
      y2 =
        "border-color:" +
        m2 +
        ";font-size:" +
        u2 +
        ";color:" +
        m2 +
        ";font-weight:" +
        d2 +
        ";pointer-events:none;white-space:nowrap;font-family:sans-serif,Arial;z-index:1000;padding:4px 8px;border-width:0;border-style:solid;";
    return (
      (y2 += "position:" + ((h2 || s2) && g2 ? "fixed;" : "absolute;")),
      (!h2 && !s2 && g2) ||
        (y2 += (n2 === He ? D : I) + ":" + (i2 + parseFloat(f2)) + "px;"),
      a2 &&
        (y2 +=
          "box-sizing:border-box;text-align:left;width:" +
          a2.offsetWidth +
          "px;"),
      (p2._isStart = b2),
      p2.setAttribute(
        "class",
        "gsap-marker-" + e2 + (t2 ? " marker-" + t2 : ""),
      ),
      (p2.style.cssText = y2),
      (p2.innerText = t2 || t2 === 0 ? e2 + "-" + t2 : e2),
      v2.children[0] ? v2.insertBefore(p2, v2.children[0]) : v2.appendChild(p2),
      (p2._offset = p2["offset" + n2.op.d2]),
      H(p2, 0, n2, b2),
      p2
    );
  }
  function Gb() {
    return 34 < at() - st && (k = k || requestAnimationFrame(Q));
  }
  function Hb() {
    (v && v.isPressed && !(v.startX > We.clientWidth)) ||
      (ze.cache++,
      v ? (k = k || requestAnimationFrame(Q)) : Q(),
      st || V("scrollStart"),
      (st = at()));
  }
  function Ib() {
    ((y = Ne.innerWidth), (m = Ne.innerHeight));
  }
  function Jb() {
    (ze.cache++,
      je ||
        h ||
        Xe.fullscreenElement ||
        Xe.webkitFullscreenElement ||
        (b &&
          y === Ne.innerWidth &&
          !(Math.abs(Ne.innerHeight - m) > 0.25 * Ne.innerHeight)) ||
        c.restart(!0));
  }
  function Mb() {
    return vb(re, "scrollEnd", Mb) || Pt(!0);
  }
  function Pb(e2) {
    for (var t2 = 0; t2 < U.length; t2 += 5)
      (!e2 || (U[t2 + 4] && U[t2 + 4].query === e2)) &&
        ((U[t2].style.cssText = U[t2 + 1]),
        U[t2].getBBox && U[t2].setAttribute("transform", U[t2 + 2] || ""),
        (U[t2 + 3].uncache = 1));
  }
  function Qb(e2, t2) {
    var r2;
    for (Qe = 0; Qe < kt.length; Qe++)
      !(r2 = kt[Qe]) ||
        (t2 && r2._ctx !== t2) ||
        (e2 ? r2.kill(1) : r2.revert(!0, !0));
    (t2 && Pb(t2), t2 || V("revert"));
  }
  function Rb(e2, t2) {
    (ze.cache++,
      (!t2 && rt) ||
        ze.forEach(function (e3) {
          return Ra(e3) && e3.cacheID++ && (e3.rec = 0);
        }),
      ct(e2) && (Ne.history.scrollRestoration = _ = e2));
  }
  function Wb() {
    (We.appendChild(w),
      (S = w.offsetHeight || Ne.innerHeight),
      We.removeChild(w));
  }
  function dc(e2, t2, r2, n2) {
    if (!e2._gsap.swappedIn) {
      for (var o2, i2 = $.length, a2 = t2.style, s2 = e2.style; i2--; )
        a2[(o2 = $[i2])] = r2[o2];
      ((a2.position = r2.position === "absolute" ? "absolute" : "relative"),
        r2.display === "inline" && (a2.display = "inline-block"),
        (s2[I] = s2[D] = "auto"),
        (a2.flexBasis = r2.flexBasis || "auto"),
        (a2.overflow = "visible"),
        (a2.boxSizing = "border-box"),
        (a2[ft] = ob(e2, qe) + xt),
        (a2[dt] = ob(e2, He) + xt),
        (a2[bt] = s2[mt] = s2.top = s2.left = "0"),
        Et(n2),
        (s2[ft] = s2.maxWidth = r2[ft]),
        (s2[dt] = s2.maxHeight = r2[dt]),
        (s2[bt] = r2[bt]),
        e2.parentNode !== t2 &&
          (e2.parentNode.insertBefore(t2, e2), t2.appendChild(e2)),
        (e2._gsap.swappedIn = !0));
    }
  }
  function gc(e2) {
    for (var t2 = Z.length, r2 = e2.style, n2 = [], o2 = 0; o2 < t2; o2++)
      n2.push(Z[o2], r2[Z[o2]]);
    return ((n2.t = e2), n2);
  }
  function jc(e2, t2, r2, n2, o2, i2, a2, s2, l2, c2, u2, f2, d2, p2) {
    (Ra(e2) && (e2 = e2(s2)),
      ct(e2) &&
        e2.substr(0, 3) === "max" &&
        (e2 = f2 + (e2.charAt(4) === "=" ? Ab("0" + e2.substr(3), r2) : 0)));
    var g2,
      h2,
      v2,
      b2 = d2 ? d2.time() : 0;
    if ((d2 && d2.seek(0), isNaN(e2) || (e2 = +e2), Sa(e2)))
      (d2 &&
        (e2 = Le.utils.mapRange(
          d2.scrollTrigger.start,
          d2.scrollTrigger.end,
          0,
          f2,
          e2,
        )),
        a2 && H(a2, r2, n2, !0));
    else {
      Ra(t2) && (t2 = t2(s2));
      var m2,
        y2,
        x2,
        _2,
        w2 = (e2 || "0").split(" ");
      ((v2 = J(t2, s2) || We),
        ((m2 = _t(v2) || {}) && (m2.left || m2.top)) ||
          kb(v2).display !== "none" ||
          ((_2 = v2.style.display),
          (v2.style.display = "block"),
          (m2 = _t(v2)),
          _2 ? (v2.style.display = _2) : v2.style.removeProperty("display")),
        (y2 = Ab(w2[0], m2[n2.d])),
        (x2 = Ab(w2[1] || "0", r2)),
        (e2 = m2[n2.p] - l2[n2.p] - c2 + y2 + o2 - x2),
        a2 && H(a2, x2, n2, r2 - x2 < 20 || (a2._isStart && 20 < x2)),
        (r2 -= r2 - x2));
    }
    if ((p2 && ((s2[p2] = e2 || -0.001), e2 < 0 && (e2 = 0)), i2)) {
      var S2 = e2 + r2,
        k2 = i2._isStart;
      ((g2 = "scroll" + n2.d2),
        H(
          i2,
          S2,
          n2,
          (k2 && 20 < S2) ||
            (!k2 &&
              (u2 ? Math.max(We[g2], Je[g2]) : i2.parentNode[g2]) <= S2 + 1),
        ),
        u2 &&
          ((l2 = _t(a2)),
          u2 && (i2.style[n2.op.p] = l2[n2.op.p] - n2.op.m - i2._offset + xt)));
    }
    return (
      d2 &&
        v2 &&
        ((g2 = _t(v2)),
        d2.seek(f2),
        (h2 = _t(v2)),
        (d2._caScrollDist = g2[n2.p] - h2[n2.p]),
        (e2 = (e2 / d2._caScrollDist) * f2)),
      d2 && d2.seek(b2),
      d2 ? e2 : Math.round(e2)
    );
  }
  function lc(e2, t2, r2, n2) {
    if (e2.parentNode !== t2) {
      var o2,
        i2,
        a2 = e2.style;
      if (t2 === We) {
        for (o2 in ((e2._stOrig = a2.cssText), (i2 = kb(e2))))
          +o2 ||
            te.test(o2) ||
            !i2[o2] ||
            typeof a2[o2] != "string" ||
            o2 === "0" ||
            (a2[o2] = i2[o2]);
        ((a2.top = r2), (a2.left = n2));
      } else a2.cssText = e2._stOrig;
      ((Le.core.getCache(e2).uncache = 1), t2.appendChild(e2));
    }
  }
  function mc(r2, e2, n2) {
    var o2 = e2,
      i2 = o2;
    return function (e3) {
      var t2 = Math.round(r2());
      return (
        t2 !== o2 &&
          t2 !== i2 &&
          3 < Math.abs(t2 - o2) &&
          3 < Math.abs(t2 - i2) &&
          ((e3 = t2), n2 && n2()),
        (i2 = o2),
        (o2 = e3)
      );
    };
  }
  function nc(e2, t2, r2) {
    var n2 = {};
    ((n2[t2.p] = "+=" + r2), Le.set(e2, n2));
  }
  function oc(c2, e2) {
    function uk(e3, t2, r2, n2, o2) {
      var i2 = uk.tween,
        a2 = t2.onComplete,
        s2 = {};
      r2 = r2 || u2();
      var l2 = mc(u2, r2, function () {
        (i2.kill(), (uk.tween = 0));
      });
      return (
        (o2 = (n2 && o2) || 0),
        (n2 = n2 || e3 - r2),
        i2 && i2.kill(),
        (t2[f2] = e3),
        ((t2.modifiers = s2)[f2] = function () {
          return l2(r2 + n2 * i2.ratio + o2 * i2.ratio * i2.ratio);
        }),
        (t2.onUpdate = function () {
          (ze.cache++, Q());
        }),
        (t2.onComplete = function () {
          ((uk.tween = 0), a2 && a2.call(i2));
        }),
        (i2 = uk.tween = Le.to(c2, t2))
      );
    }
    var u2 = K(c2, e2),
      f2 = "_scroll" + e2.p2;
    return (
      ((c2[f2] = u2).wheelHandler = function () {
        return uk.tween && uk.tween.kill() && (uk.tween = 0);
      }),
      ub(c2, "wheel", u2.wheelHandler),
      re.isTouch && ub(c2, "touchmove", u2.wheelHandler),
      uk
    );
  }
  var Le,
    s,
    Ne,
    Xe,
    Je,
    We,
    l,
    c,
    Ge,
    Ve,
    Ue,
    u,
    je,
    Ke,
    f,
    Qe,
    d,
    p,
    g,
    Ze,
    et,
    h,
    v,
    b,
    m,
    y,
    R,
    x,
    _,
    w,
    S,
    tt,
    k,
    rt,
    nt,
    ot,
    it = 1,
    at = Date.now,
    T = at(),
    st = 0,
    lt = 0,
    ct = function (e2) {
      return typeof e2 == "string";
    },
    ut = Math.abs,
    D = "right",
    I = "bottom",
    ft = "width",
    dt = "height",
    pt = "Right",
    gt = "Left",
    ht = "Top",
    vt = "Bottom",
    bt = "padding",
    mt = "margin",
    yt = "Width",
    Y = "Height",
    xt = "px",
    _t = function (e2, t2) {
      var r2 =
          t2 &&
          kb(e2)[f] !== "matrix(1, 0, 0, 1, 0, 0)" &&
          Le.to(e2, {
            x: 0,
            y: 0,
            xPercent: 0,
            yPercent: 0,
            rotation: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            skewX: 0,
            skewY: 0,
          }).progress(1),
        n2 = e2.getBoundingClientRect();
      return (r2 && r2.progress(0).kill(), n2);
    },
    wt = {
      startColor: "green",
      endColor: "red",
      indent: 0,
      fontSize: "16px",
      fontWeight: "normal",
    },
    St = { toggleActions: "play", anticipatePin: 0 },
    q = { top: 0, left: 0, center: 0.5, bottom: 1, right: 1 },
    H = function (e2, t2, r2, n2) {
      var o2 = { display: "block" },
        i2 = r2[n2 ? "os2" : "p2"],
        a2 = r2[n2 ? "p2" : "os2"];
      ((e2._isFlipped = n2),
        (o2[r2.a + "Percent"] = n2 ? -100 : 0),
        (o2[r2.a] = n2 ? "1px" : 0),
        (o2["border" + i2 + yt] = 1),
        (o2["border" + a2 + yt] = 0),
        (o2[r2.p] = t2 + "px"),
        Le.set(e2, o2));
    },
    kt = [],
    Tt = {},
    X = {},
    W = [],
    V = function (e2) {
      return (
        (X[e2] &&
          X[e2].map(function (e3) {
            return e3();
          })) ||
        W
      );
    },
    U = [],
    Ct = 0,
    Pt = function (e2, t2) {
      if (!st || e2) {
        (Wb(),
          (rt = re.isRefreshing = !0),
          ze.forEach(function (e3) {
            return Ra(e3) && ++e3.cacheID && (e3.rec = e3());
          }));
        var r2 = V("refreshInit");
        (Ze && re.sort(),
          t2 || Qb(),
          ze.forEach(function (e3) {
            Ra(e3) &&
              (e3.smooth && (e3.target.style.scrollBehavior = "auto"), e3(0));
          }),
          kt.slice(0).forEach(function (e3) {
            return e3.refresh();
          }),
          kt.forEach(function (e3, t3) {
            if (e3._subPinOffset && e3.pin) {
              var r3 = e3.vars.horizontal ? "offsetWidth" : "offsetHeight",
                n2 = e3.pin[r3];
              (e3.revert(!0, 1),
                e3.adjustPinSpacing(e3.pin[r3] - n2),
                e3.refresh());
            }
          }),
          kt.forEach(function (e3) {
            var t3 = Oa(e3.scroller, e3._dir);
            (e3.vars.end === "max" || (e3._endClamp && e3.end > t3)) &&
              e3.setPositions(e3.start, Math.max(e3.start + 1, t3), !0);
          }),
          r2.forEach(function (e3) {
            return e3 && e3.render && e3.render(-1);
          }),
          ze.forEach(function (e3) {
            Ra(e3) &&
              (e3.smooth &&
                requestAnimationFrame(function () {
                  return (e3.target.style.scrollBehavior = "smooth");
                }),
              e3.rec && e3(e3.rec));
          }),
          Rb(_, 1),
          c.pause(),
          Ct++,
          Q((rt = 2)),
          kt.forEach(function (e3) {
            return Ra(e3.vars.onRefresh) && e3.vars.onRefresh(e3);
          }),
          (rt = re.isRefreshing = !1),
          V("refresh"));
      } else ub(re, "scrollEnd", Mb);
    },
    j = 0,
    Mt = 1,
    Q = function (e2) {
      if (!rt || e2 === 2) {
        ((re.isUpdating = !0), ot && ot.update(0));
        var t2 = kt.length,
          r2 = at(),
          n2 = 50 <= r2 - T,
          o2 = t2 && kt[0].scroll();
        if (
          ((Mt = o2 < j ? -1 : 1),
          rt || (j = o2),
          n2 &&
            (st && !Ke && 200 < r2 - st && ((st = 0), V("scrollEnd")),
            (Ue = T),
            (T = r2)),
          Mt < 0)
        ) {
          for (Qe = t2; 0 < Qe--; ) kt[Qe] && kt[Qe].update(0, n2);
          Mt = 1;
        } else for (Qe = 0; Qe < t2; Qe++) kt[Qe] && kt[Qe].update(0, n2);
        re.isUpdating = !1;
      }
      k = 0;
    },
    $ = [
      "left",
      "top",
      I,
      D,
      mt + vt,
      mt + pt,
      mt + ht,
      mt + gt,
      "display",
      "flexShrink",
      "float",
      "zIndex",
      "gridColumnStart",
      "gridColumnEnd",
      "gridRowStart",
      "gridRowEnd",
      "gridArea",
      "justifySelf",
      "alignSelf",
      "placeSelf",
      "order",
    ],
    Z = $.concat([
      ft,
      dt,
      "boxSizing",
      "max" + yt,
      "max" + Y,
      "position",
      mt,
      bt,
      bt + ht,
      bt + pt,
      bt + vt,
      bt + gt,
    ]),
    ee = /([A-Z])/g,
    Et = function (e2) {
      if (e2) {
        var t2,
          r2,
          n2 = e2.t.style,
          o2 = e2.length,
          i2 = 0;
        for (
          (e2.t._gsap || Le.core.getCache(e2.t)).uncache = 1;
          i2 < o2;
          i2 += 2
        )
          ((r2 = e2[i2 + 1]),
            (t2 = e2[i2]),
            r2
              ? (n2[t2] = r2)
              : n2[t2] &&
                n2.removeProperty(t2.replace(ee, "-$1").toLowerCase()));
      }
    },
    Ot = { left: 0, top: 0 },
    te = /(webkit|moz|length|cssText|inset)/i,
    re =
      ((ScrollTrigger.prototype.init = function (E2, O2) {
        if (
          ((this.progress = this.start = 0), this.vars && this.kill(!0, !0), lt)
        ) {
          var A2,
            n2,
            p2,
            R2,
            B2,
            D2,
            F2,
            I2,
            Y2,
            q2,
            H2,
            e2,
            L2,
            N2,
            X2,
            W2,
            G2,
            V2,
            t2,
            U2,
            b2,
            j2,
            Q2,
            m2,
            $2,
            y2,
            Z2,
            x2,
            r2,
            _2,
            w2,
            ee2,
            o2,
            g2,
            te2,
            re2,
            ne2,
            S2,
            i2,
            k2 = (E2 = mb(
              ct(E2) || Sa(E2) || E2.nodeType ? { trigger: E2 } : E2,
              St,
            )).onUpdate,
            T2 = E2.toggleClass,
            a2 = E2.id,
            C2 = E2.onToggle,
            oe2 = E2.onRefresh,
            P2 = E2.scrub,
            ie2 = E2.trigger,
            ae2 = E2.pin,
            se = E2.pinSpacing,
            le = E2.invalidateOnRefresh,
            M2 = E2.anticipatePin,
            s2 = E2.onScrubComplete,
            h2 = E2.onSnapComplete,
            ce = E2.once,
            ue = E2.snap,
            fe = E2.pinReparent,
            l2 = E2.pinSpacer,
            de = E2.containerAnimation,
            pe = E2.fastScrollEnd,
            ge = E2.preventOverlaps,
            he =
              E2.horizontal || (E2.containerAnimation && E2.horizontal !== !1)
                ? qe
                : He,
            ve = !P2 && P2 !== 0,
            be = J(E2.scroller || Ne),
            c2 = Le.core.getCache(be),
            me = Ja(be),
            ye =
              ("pinType" in E2
                ? E2.pinType
                : z(be, "pinType") || (me && "fixed")) === "fixed",
            xe = [E2.onEnter, E2.onLeave, E2.onEnterBack, E2.onLeaveBack],
            _e = ve && E2.toggleActions.split(" "),
            we = "markers" in E2 ? E2.markers : St.markers,
            Se2 = me ? 0 : parseFloat(kb(be)["border" + he.p2 + yt]) || 0,
            ke2 = this,
            Te2 =
              E2.onRefreshInit &&
              function () {
                return E2.onRefreshInit(ke2);
              },
            Ce2 = (function (e3, t3, r3) {
              var n3 = r3.d,
                o3 = r3.d2,
                i3 = r3.a;
              return (i3 = z(e3, "getBoundingClientRect"))
                ? function () {
                    return i3()[n3];
                  }
                : function () {
                    return (t3 ? Ka(o3) : e3["client" + o3]) || 0;
                  };
            })(be, me, he),
            Pe2 = (function (e3, t3) {
              return !t3 || ~Ie.indexOf(e3)
                ? La(e3)
                : function () {
                    return Ot;
                  };
            })(be, me),
            Me2 = 0,
            Ee2 = 0,
            Oe2 = 0,
            Ae2 = K(be, he);
          if (
            ((ke2._startClamp = ke2._endClamp = !1),
            (ke2._dir = he),
            (M2 *= 45),
            (ke2.scroller = be),
            (ke2.scroll = de ? de.time.bind(de) : Ae2),
            (R2 = Ae2()),
            (ke2.vars = E2),
            (O2 = O2 || E2.animation),
            "refreshPriority" in E2 &&
              ((Ze = 1), E2.refreshPriority === -9999 && (ot = ke2)),
            (c2.tweenScroll = c2.tweenScroll || {
              top: oc(be, He),
              left: oc(be, qe),
            }),
            (ke2.tweenTo = A2 = c2.tweenScroll[he.p]),
            (ke2.scrubDuration = function (e3) {
              (o2 = Sa(e3) && e3)
                ? ee2
                  ? ee2.duration(e3)
                  : (ee2 = Le.to(O2, {
                      ease: "expo",
                      totalProgress: "+=0",
                      duration: o2,
                      paused: !0,
                      onComplete: function () {
                        return s2 && s2(ke2);
                      },
                    }))
                : (ee2 && ee2.progress(1).kill(), (ee2 = 0));
            }),
            O2 &&
              ((O2.vars.lazy = !1),
              (O2._initted && !ke2.isReverted) ||
                (O2.vars.immediateRender !== !1 &&
                  E2.immediateRender !== !1 &&
                  O2.duration() &&
                  O2.render(0, !0, !0)),
              (ke2.animation = O2.pause()),
              (O2.scrollTrigger = ke2).scrubDuration(P2),
              (_2 = 0),
              (a2 = a2 || O2.vars.id)),
            ue &&
              ((Ta(ue) && !ue.push) || (ue = { snapTo: ue }),
              "scrollBehavior" in We.style &&
                Le.set(me ? [We, Je] : be, { scrollBehavior: "auto" }),
              ze.forEach(function (e3) {
                return (
                  Ra(e3) &&
                  e3.target === (me ? Xe.scrollingElement || Je : be) &&
                  (e3.smooth = !1)
                );
              }),
              (p2 = Ra(ue.snapTo)
                ? ue.snapTo
                : ue.snapTo === "labels"
                  ? (function (t3) {
                      return function (e3) {
                        return Le.utils.snap(pb(t3), e3);
                      };
                    })(O2)
                  : ue.snapTo === "labelsDirectional"
                    ? (function (r3) {
                        return function (e3, t3) {
                          return rb(pb(r3))(e3, t3.direction);
                        };
                      })(O2)
                    : ue.directional !== !1
                      ? function (e3, t3) {
                          return rb(ue.snapTo)(
                            e3,
                            at() - Ee2 < 500 ? 0 : t3.direction,
                          );
                        }
                      : Le.utils.snap(ue.snapTo)),
              (g2 = ue.duration || { min: 0.1, max: 2 }),
              (g2 = Ta(g2) ? Ve(g2.min, g2.max) : Ve(g2, g2)),
              (te2 = Le.delayedCall(ue.delay || o2 / 2 || 0.1, function () {
                var e3 = Ae2(),
                  t3 = at() - Ee2 < 500,
                  r3 = A2.tween;
                if (
                  !(t3 || Math.abs(ke2.getVelocity()) < 10) ||
                  r3 ||
                  Ke ||
                  Me2 === e3
                )
                  ke2.isActive && Me2 !== e3 && te2.restart(!0);
                else {
                  var n3 = (e3 - D2) / N2,
                    o3 = O2 && !ve ? O2.totalProgress() : n3,
                    i3 = t3 ? 0 : ((o3 - w2) / (at() - Ue)) * 1e3 || 0,
                    a3 = Le.utils.clamp(-n3, 1 - n3, (ut(i3 / 2) * i3) / 0.185),
                    s3 = n3 + (ue.inertia === !1 ? 0 : a3),
                    l3 = Ve(0, 1, p2(s3, ke2)),
                    c3 = Math.round(D2 + l3 * N2),
                    u3 = ue.onStart,
                    f3 = ue.onInterrupt,
                    d3 = ue.onComplete;
                  if (e3 <= F2 && D2 <= e3 && c3 !== e3) {
                    if (r3 && !r3._initted && r3.data <= ut(c3 - e3)) return;
                    (ue.inertia === !1 && (a3 = l3 - n3),
                      A2(
                        c3,
                        {
                          duration: g2(
                            ut(
                              (0.185 * Math.max(ut(s3 - o3), ut(l3 - o3))) /
                                i3 /
                                0.05 || 0,
                            ),
                          ),
                          ease: ue.ease || "power3",
                          data: ut(c3 - e3),
                          onInterrupt: function () {
                            return te2.restart(!0) && f3 && f3(ke2);
                          },
                          onComplete: function () {
                            (ke2.update(),
                              (Me2 = Ae2()),
                              (_2 = w2 =
                                O2 && !ve ? O2.totalProgress() : ke2.progress),
                              h2 && h2(ke2),
                              d3 && d3(ke2));
                          },
                        },
                        e3,
                        a3 * N2,
                        c3 - e3 - a3 * N2,
                      ),
                      u3 && u3(ke2, A2.tween));
                  }
                }
              }).pause())),
            a2 && (Tt[a2] = ke2),
            (i2 =
              (i2 =
                (ie2 = ke2.trigger = J(ie2 || (ae2 !== !0 && ae2))) &&
                ie2._gsap &&
                ie2._gsap.stRevert) && i2(ke2)),
            (ae2 = ae2 === !0 ? ie2 : J(ae2)),
            ct(T2) && (T2 = { targets: ie2, className: T2 }),
            ae2 &&
              (se === !1 ||
                se === mt ||
                (se =
                  !(
                    !se &&
                    ae2.parentNode &&
                    ae2.parentNode.style &&
                    kb(ae2.parentNode).display === "flex"
                  ) && bt),
              (ke2.pin = ae2),
              (n2 = Le.core.getCache(ae2)).spacer
                ? (X2 = n2.pinState)
                : (l2 &&
                    ((l2 = J(l2)) &&
                      !l2.nodeType &&
                      (l2 = l2.current || l2.nativeElement),
                    (n2.spacerIsNative = !!l2),
                    l2 && (n2.spacerState = gc(l2))),
                  (n2.spacer = V2 = l2 || Xe.createElement("div")),
                  V2.classList.add("pin-spacer"),
                  a2 && V2.classList.add("pin-spacer-" + a2),
                  (n2.pinState = X2 = gc(ae2))),
              E2.force3D !== !1 && Le.set(ae2, { force3D: !0 }),
              (ke2.spacer = V2 = n2.spacer),
              (r2 = kb(ae2)),
              (m2 = r2[se + he.os2]),
              (U2 = Le.getProperty(ae2)),
              (b2 = Le.quickSetter(ae2, he.a, xt)),
              dc(ae2, V2, r2),
              (G2 = gc(ae2))),
            we)
          ) {
            ((e2 = Ta(we) ? mb(we, wt) : wt),
              (q2 = Bb("scroller-start", a2, be, he, e2, 0)),
              (H2 = Bb("scroller-end", a2, be, he, e2, 0, q2)),
              (t2 = q2["offset" + he.op.d2]));
            var u2 = J(z(be, "content") || be);
            ((I2 = this.markerStart = Bb("start", a2, u2, he, e2, t2, 0, de)),
              (Y2 = this.markerEnd = Bb("end", a2, u2, he, e2, t2, 0, de)),
              de && (S2 = Le.quickSetter([I2, Y2], he.a, xt)),
              ye ||
                (Ie.length && z(be, "fixedMarkers") === !0) ||
                ((function (e3) {
                  var t3 = kb(e3).position;
                  e3.style.position =
                    t3 === "absolute" || t3 === "fixed" ? t3 : "relative";
                })(me ? We : be),
                Le.set([q2, H2], { force3D: !0 }),
                (y2 = Le.quickSetter(q2, he.a, xt)),
                (x2 = Le.quickSetter(H2, he.a, xt))));
          }
          if (de) {
            var f2 = de.vars.onUpdate,
              d2 = de.vars.onUpdateParams;
            de.eventCallback("onUpdate", function () {
              (ke2.update(0, 0, 1), f2 && f2.apply(de, d2 || []));
            });
          }
          if (
            ((ke2.previous = function () {
              return kt[kt.indexOf(ke2) - 1];
            }),
            (ke2.next = function () {
              return kt[kt.indexOf(ke2) + 1];
            }),
            (ke2.revert = function (e3, t3) {
              if (!t3) return ke2.kill(!0);
              var r3 = e3 !== !1 || !ke2.enabled,
                n3 = je;
              r3 !== ke2.isReverted &&
                (r3 &&
                  ((re2 = Math.max(Ae2(), ke2.scroll.rec || 0)),
                  (Oe2 = ke2.progress),
                  (ne2 = O2 && O2.progress())),
                I2 &&
                  [I2, Y2, q2, H2].forEach(function (e4) {
                    return (e4.style.display = r3 ? "none" : "block");
                  }),
                r3 && (je = ke2).update(r3),
                !ae2 ||
                  (fe && ke2.isActive) ||
                  (r3
                    ? (function (e4, t4, r4) {
                        Et(r4);
                        var n4 = e4._gsap;
                        if (n4.spacerIsNative) Et(n4.spacerState);
                        else if (e4._gsap.swappedIn) {
                          var o3 = t4.parentNode;
                          o3 && (o3.insertBefore(e4, t4), o3.removeChild(t4));
                        }
                        e4._gsap.swappedIn = !1;
                      })(ae2, V2, X2)
                    : dc(ae2, V2, kb(ae2), $2)),
                r3 || ke2.update(r3),
                (je = n3),
                (ke2.isReverted = r3));
            }),
            (ke2.refresh = function (e3, t3, r3, n3) {
              if ((!je && ke2.enabled) || t3)
                if (ae2 && e3 && st) ub(ScrollTrigger, "scrollEnd", Mb);
                else {
                  (!rt && Te2 && Te2(ke2),
                    (je = ke2),
                    A2.tween && !r3 && (A2.tween.kill(), (A2.tween = 0)),
                    ee2 && ee2.pause(),
                    le && O2 && O2.revert({ kill: !1 }).invalidate(),
                    ke2.isReverted || ke2.revert(!0, !0),
                    (ke2._subPinOffset = !1));
                  var o3,
                    i3,
                    a3,
                    s3,
                    l3,
                    c3,
                    u3,
                    f3,
                    d3,
                    p3,
                    g3,
                    h3,
                    v3,
                    b3 = Ce2(),
                    m3 = Pe2(),
                    y3 = de ? de.duration() : Oa(be, he),
                    x3 = N2 <= 0.01,
                    _3 = 0,
                    w3 = n3 || 0,
                    S3 = Ta(r3) ? r3.end : E2.end,
                    k3 = E2.endTrigger || ie2,
                    T3 = Ta(r3)
                      ? r3.start
                      : E2.start ||
                        (E2.start !== 0 && ie2 ? (ae2 ? "0 0" : "0 100%") : 0),
                    C3 = (ke2.pinnedContainer =
                      E2.pinnedContainer && J(E2.pinnedContainer, ke2)),
                    P3 = (ie2 && Math.max(0, kt.indexOf(ke2))) || 0,
                    M3 = P3;
                  for (
                    we &&
                    Ta(r3) &&
                    ((h3 = Le.getProperty(q2, he.p)),
                    (v3 = Le.getProperty(H2, he.p)));
                    M3--;
                  )
                    ((c3 = kt[M3]).end || c3.refresh(0, 1) || (je = ke2),
                      !(u3 = c3.pin) ||
                        (u3 !== ie2 && u3 !== ae2 && u3 !== C3) ||
                        c3.isReverted ||
                        ((p3 = p3 || []).unshift(c3), c3.revert(!0, !0)),
                      c3 !== kt[M3] && (P3--, M3--));
                  for (
                    Ra(T3) && (T3 = T3(ke2)),
                      T3 = Aa(T3, "start", ke2),
                      D2 =
                        jc(
                          T3,
                          ie2,
                          b3,
                          he,
                          Ae2(),
                          I2,
                          q2,
                          ke2,
                          m3,
                          Se2,
                          ye,
                          y3,
                          de,
                          ke2._startClamp && "_startClamp",
                        ) || (ae2 ? -0.001 : 0),
                      Ra(S3) && (S3 = S3(ke2)),
                      ct(S3) &&
                        !S3.indexOf("+=") &&
                        (~S3.indexOf(" ")
                          ? (S3 = (ct(T3) ? T3.split(" ")[0] : "") + S3)
                          : ((_3 = Ab(S3.substr(2), b3)),
                            (S3 = ct(T3)
                              ? T3
                              : (de
                                  ? Le.utils.mapRange(
                                      0,
                                      de.duration(),
                                      de.scrollTrigger.start,
                                      de.scrollTrigger.end,
                                      D2,
                                    )
                                  : D2) + _3),
                            (k3 = ie2))),
                      S3 = Aa(S3, "end", ke2),
                      F2 =
                        Math.max(
                          D2,
                          jc(
                            S3 || (k3 ? "100% 0" : y3),
                            k3,
                            b3,
                            he,
                            Ae2() + _3,
                            Y2,
                            H2,
                            ke2,
                            m3,
                            Se2,
                            ye,
                            y3,
                            de,
                            ke2._endClamp && "_endClamp",
                          ),
                        ) || -0.001,
                      _3 = 0,
                      M3 = P3;
                    M3--;
                  )
                    (u3 = (c3 = kt[M3]).pin) &&
                      c3.start - c3._pinPush <= D2 &&
                      !de &&
                      0 < c3.end &&
                      ((o3 =
                        c3.end -
                        (ke2._startClamp ? Math.max(0, c3.start) : c3.start)),
                      ((u3 === ie2 && c3.start - c3._pinPush < D2) ||
                        u3 === C3) &&
                        isNaN(T3) &&
                        (_3 += o3 * (1 - c3.progress)),
                      u3 === ae2 && (w3 += o3));
                  if (
                    ((D2 += _3),
                    (F2 += _3),
                    ke2._startClamp && (ke2._startClamp += _3),
                    ke2._endClamp &&
                      !rt &&
                      ((ke2._endClamp = F2 || -0.001),
                      (F2 = Math.min(F2, Oa(be, he)))),
                    (N2 = F2 - D2 || ((D2 -= 0.01) && 0.001)),
                    x3 &&
                      (Oe2 = Le.utils.clamp(
                        0,
                        1,
                        Le.utils.normalize(D2, F2, re2),
                      )),
                    (ke2._pinPush = w3),
                    I2 &&
                      _3 &&
                      (((o3 = {})[he.a] = "+=" + _3),
                      C3 && (o3[he.p] = "-=" + Ae2()),
                      Le.set([I2, Y2], o3)),
                    ae2)
                  )
                    ((o3 = kb(ae2)),
                      (s3 = he === He),
                      (a3 = Ae2()),
                      (j2 = parseFloat(U2(he.a)) + w3),
                      !y3 &&
                        1 < F2 &&
                        ((g3 = {
                          style: (g3 = (me ? Xe.scrollingElement || Je : be)
                            .style),
                          value: g3["overflow" + he.a.toUpperCase()],
                        }),
                        me &&
                          kb(We)["overflow" + he.a.toUpperCase()] !==
                            "scroll" &&
                          (g3.style["overflow" + he.a.toUpperCase()] =
                            "scroll")),
                      dc(ae2, V2, o3),
                      (G2 = gc(ae2)),
                      (i3 = _t(ae2, !0)),
                      (f3 = ye && K(be, s3 ? qe : He)()),
                      se &&
                        ((($2 = [se + he.os2, N2 + w3 + xt]).t = V2),
                        (M3 = se === bt ? ob(ae2, he) + N2 + w3 : 0) &&
                          $2.push(he.d, M3 + xt),
                        Et($2),
                        C3 &&
                          kt.forEach(function (e4) {
                            e4.pin === C3 &&
                              e4.vars.pinSpacing !== !1 &&
                              (e4._subPinOffset = !0);
                          }),
                        ye && Ae2(re2)),
                      ye &&
                        (((l3 = {
                          top: i3.top + (s3 ? a3 - D2 : f3) + xt,
                          left: i3.left + (s3 ? f3 : a3 - D2) + xt,
                          boxSizing: "border-box",
                          position: "fixed",
                        })[ft] = l3.maxWidth =
                          Math.ceil(i3.width) + xt),
                        (l3[dt] = l3.maxHeight = Math.ceil(i3.height) + xt),
                        (l3[mt] =
                          l3[mt + ht] =
                          l3[mt + pt] =
                          l3[mt + vt] =
                          l3[mt + gt] =
                            "0"),
                        (l3[bt] = o3[bt]),
                        (l3[bt + ht] = o3[bt + ht]),
                        (l3[bt + pt] = o3[bt + pt]),
                        (l3[bt + vt] = o3[bt + vt]),
                        (l3[bt + gt] = o3[bt + gt]),
                        (W2 = (function (e4, t4, r4) {
                          for (
                            var n4, o4 = [], i4 = e4.length, a4 = r4 ? 8 : 0;
                            a4 < i4;
                            a4 += 2
                          )
                            ((n4 = e4[a4]),
                              o4.push(n4, n4 in t4 ? t4[n4] : e4[a4 + 1]));
                          return ((o4.t = e4.t), o4);
                        })(X2, l3, fe)),
                        rt && Ae2(0)),
                      O2
                        ? ((d3 = O2._initted),
                          et(1),
                          O2.render(O2.duration(), !0, !0),
                          (Q2 = U2(he.a) - j2 + N2 + w3),
                          (Z2 = 1 < Math.abs(N2 - Q2)),
                          ye && Z2 && W2.splice(W2.length - 2, 2),
                          O2.render(0, !0, !0),
                          d3 || O2.invalidate(!0),
                          O2.parent || O2.totalTime(O2.totalTime()),
                          et(0))
                        : (Q2 = N2),
                      g3 &&
                        (g3.value
                          ? (g3.style["overflow" + he.a.toUpperCase()] =
                              g3.value)
                          : g3.style.removeProperty("overflow-" + he.a)));
                  else if (ie2 && Ae2() && !de)
                    for (i3 = ie2.parentNode; i3 && i3 !== We; )
                      (i3._pinOffset &&
                        ((D2 -= i3._pinOffset), (F2 -= i3._pinOffset)),
                        (i3 = i3.parentNode));
                  (p3 &&
                    p3.forEach(function (e4) {
                      return e4.revert(!1, !0);
                    }),
                    (ke2.start = D2),
                    (ke2.end = F2),
                    (R2 = B2 = rt ? re2 : Ae2()),
                    de || rt || (R2 < re2 && Ae2(re2), (ke2.scroll.rec = 0)),
                    ke2.revert(!1, !0),
                    (Ee2 = at()),
                    te2 && ((Me2 = -1), te2.restart(!0)),
                    (je = 0),
                    O2 &&
                      ve &&
                      (O2._initted || ne2) &&
                      O2.progress() !== ne2 &&
                      O2.progress(ne2 || 0, !0).render(O2.time(), !0, !0),
                    (x3 || Oe2 !== ke2.progress || de) &&
                      (O2 &&
                        !ve &&
                        O2.totalProgress(
                          de && D2 < -0.001 && !Oe2
                            ? Le.utils.normalize(D2, F2, 0)
                            : Oe2,
                          !0,
                        ),
                      (ke2.progress = x3 || (R2 - D2) / N2 === Oe2 ? 0 : Oe2)),
                    ae2 &&
                      se &&
                      (V2._pinOffset = Math.round(ke2.progress * Q2)),
                    ee2 && ee2.invalidate(),
                    isNaN(h3) ||
                      ((h3 -= Le.getProperty(q2, he.p)),
                      (v3 -= Le.getProperty(H2, he.p)),
                      nc(q2, he, h3),
                      nc(I2, he, h3 - (n3 || 0)),
                      nc(H2, he, v3),
                      nc(Y2, he, v3 - (n3 || 0))),
                    x3 && !rt && ke2.update(),
                    !oe2 || rt || L2 || ((L2 = !0), oe2(ke2), (L2 = !1)));
                }
            }),
            (ke2.getVelocity = function () {
              return ((Ae2() - B2) / (at() - Ue)) * 1e3 || 0;
            }),
            (ke2.endAnimation = function () {
              (Ua(ke2.callbackAnimation),
                O2 &&
                  (ee2
                    ? ee2.progress(1)
                    : O2.paused()
                      ? ve || Ua(O2, ke2.direction < 0, 1)
                      : Ua(O2, O2.reversed())));
            }),
            (ke2.labelToScroll = function (e3) {
              return (
                (O2 &&
                  O2.labels &&
                  (D2 || ke2.refresh() || D2) +
                    (O2.labels[e3] / O2.duration()) * N2) ||
                0
              );
            }),
            (ke2.getTrailing = function (t3) {
              var e3 = kt.indexOf(ke2),
                r3 =
                  0 < ke2.direction
                    ? kt.slice(0, e3).reverse()
                    : kt.slice(e3 + 1);
              return (
                ct(t3)
                  ? r3.filter(function (e4) {
                      return e4.vars.preventOverlaps === t3;
                    })
                  : r3
              ).filter(function (e4) {
                return 0 < ke2.direction ? e4.end <= D2 : e4.start >= F2;
              });
            }),
            (ke2.update = function (e3, t3, r3) {
              if (!de || r3 || e3) {
                var n3,
                  o3,
                  i3,
                  a3,
                  s3,
                  l3,
                  c3,
                  u3 = rt === !0 ? re2 : ke2.scroll(),
                  f3 = e3 ? 0 : (u3 - D2) / N2,
                  d3 = f3 < 0 ? 0 : 1 < f3 ? 1 : f3 || 0,
                  p3 = ke2.progress;
                if (
                  (t3 &&
                    ((B2 = R2),
                    (R2 = de ? Ae2() : u3),
                    ue &&
                      ((w2 = _2), (_2 = O2 && !ve ? O2.totalProgress() : d3))),
                  M2 &&
                    !d3 &&
                    ae2 &&
                    !je &&
                    !it &&
                    st &&
                    D2 < u3 + ((u3 - B2) / (at() - Ue)) * M2 &&
                    (d3 = 1e-4),
                  d3 !== p3 && ke2.enabled)
                ) {
                  if (
                    ((a3 =
                      (s3 =
                        (n3 = ke2.isActive = !!d3 && d3 < 1) !=
                        (!!p3 && p3 < 1)) || !!d3 != !!p3),
                    (ke2.direction = p3 < d3 ? 1 : -1),
                    (ke2.progress = d3),
                    a3 &&
                      !je &&
                      ((o3 = d3 && !p3 ? 0 : d3 === 1 ? 1 : p3 === 1 ? 2 : 3),
                      ve &&
                        ((i3 =
                          (!s3 && _e[o3 + 1] !== "none" && _e[o3 + 1]) ||
                          _e[o3]),
                        (c3 =
                          O2 &&
                          (i3 === "complete" || i3 === "reset" || i3 in O2)))),
                    ge &&
                      (s3 || c3) &&
                      (c3 || P2 || !O2) &&
                      (Ra(ge)
                        ? ge(ke2)
                        : ke2.getTrailing(ge).forEach(function (e4) {
                            return e4.endAnimation();
                          })),
                    ve ||
                      (!ee2 || je || it
                        ? O2 && O2.totalProgress(d3, !(!je || (!Ee2 && !e3)))
                        : (ee2._dp._time - ee2._start !== ee2._time &&
                            ee2.render(ee2._dp._time - ee2._start),
                          ee2.resetTo
                            ? ee2.resetTo(
                                "totalProgress",
                                d3,
                                O2._tTime / O2._tDur,
                              )
                            : ((ee2.vars.totalProgress = d3),
                              ee2.invalidate().restart()))),
                    ae2)
                  )
                    if ((e3 && se && (V2.style[se + he.os2] = m2), ye)) {
                      if (a3) {
                        if (
                          ((l3 =
                            !e3 &&
                            p3 < d3 &&
                            u3 < F2 + 1 &&
                            u3 + 1 >= Oa(be, he)),
                          fe)
                        )
                          if (e3 || (!n3 && !l3)) lc(ae2, V2);
                          else {
                            var g3 = _t(ae2, !0),
                              h3 = u3 - D2;
                            lc(
                              ae2,
                              We,
                              g3.top + (he === He ? h3 : 0) + xt,
                              g3.left + (he === He ? 0 : h3) + xt,
                            );
                          }
                        (Et(n3 || l3 ? W2 : G2),
                          (Z2 && d3 < 1 && n3) ||
                            b2(j2 + (d3 !== 1 || l3 ? 0 : Q2)));
                      }
                    } else b2(Ga(j2 + Q2 * d3));
                  (!ue || A2.tween || je || it || te2.restart(!0),
                    T2 &&
                      (s3 || (ce && d3 && (d3 < 1 || !tt))) &&
                      Ge(T2.targets).forEach(function (e4) {
                        return e4.classList[n3 || ce ? "add" : "remove"](
                          T2.className,
                        );
                      }),
                    !k2 || ve || e3 || k2(ke2),
                    a3 && !je
                      ? (ve &&
                          (c3 &&
                            (i3 === "complete"
                              ? O2.pause().totalProgress(1)
                              : i3 === "reset"
                                ? O2.restart(!0).pause()
                                : i3 === "restart"
                                  ? O2.restart(!0)
                                  : O2[i3]()),
                          k2 && k2(ke2)),
                        (!s3 && tt) ||
                          (C2 && s3 && Va(ke2, C2),
                          xe[o3] && Va(ke2, xe[o3]),
                          ce && (d3 === 1 ? ke2.kill(!1, 1) : (xe[o3] = 0)),
                          s3 ||
                            (xe[(o3 = d3 === 1 ? 1 : 3)] && Va(ke2, xe[o3]))),
                        pe &&
                          !n3 &&
                          Math.abs(ke2.getVelocity()) > (Sa(pe) ? pe : 2500) &&
                          (Ua(ke2.callbackAnimation),
                          ee2
                            ? ee2.progress(1)
                            : Ua(O2, i3 === "reverse" ? 1 : !d3, 1)))
                      : ve && k2 && !je && k2(ke2));
                }
                if (x2) {
                  var v3 = de
                    ? (u3 / de.duration()) * (de._caScrollDist || 0)
                    : u3;
                  (y2(v3 + (q2._isFlipped ? 1 : 0)), x2(v3));
                }
                S2 && S2((-u3 / de.duration()) * (de._caScrollDist || 0));
              }
            }),
            (ke2.enable = function (e3, t3) {
              ke2.enabled ||
                ((ke2.enabled = !0),
                ub(be, "resize", Jb),
                me || ub(be, "scroll", Hb),
                Te2 && ub(ScrollTrigger, "refreshInit", Te2),
                e3 !== !1 &&
                  ((ke2.progress = Oe2 = 0), (R2 = B2 = Me2 = Ae2())),
                t3 !== !1 && ke2.refresh());
            }),
            (ke2.getTween = function (e3) {
              return e3 && A2 ? A2.tween : ee2;
            }),
            (ke2.setPositions = function (e3, t3, r3, n3) {
              if (de) {
                var o3 = de.scrollTrigger,
                  i3 = de.duration(),
                  a3 = o3.end - o3.start;
                ((e3 = o3.start + (a3 * e3) / i3),
                  (t3 = o3.start + (a3 * t3) / i3));
              }
              (ke2.refresh(
                !1,
                !1,
                {
                  start: Ba(e3, r3 && !!ke2._startClamp),
                  end: Ba(t3, r3 && !!ke2._endClamp),
                },
                n3,
              ),
                ke2.update());
            }),
            (ke2.adjustPinSpacing = function (e3) {
              if ($2 && e3) {
                var t3 = $2.indexOf(he.d) + 1;
                (($2[t3] = parseFloat($2[t3]) + e3 + xt),
                  ($2[1] = parseFloat($2[1]) + e3 + xt),
                  Et($2));
              }
            }),
            (ke2.disable = function (e3, t3) {
              if (
                ke2.enabled &&
                (e3 !== !1 && ke2.revert(!0, !0),
                (ke2.enabled = ke2.isActive = !1),
                t3 || (ee2 && ee2.pause()),
                (re2 = 0),
                n2 && (n2.uncache = 1),
                Te2 && vb(ScrollTrigger, "refreshInit", Te2),
                te2 &&
                  (te2.pause(), A2.tween && A2.tween.kill() && (A2.tween = 0)),
                !me)
              ) {
                for (var r3 = kt.length; r3--; )
                  if (kt[r3].scroller === be && kt[r3] !== ke2) return;
                (vb(be, "resize", Jb), me || vb(be, "scroll", Hb));
              }
            }),
            (ke2.kill = function (e3, t3) {
              (ke2.disable(e3, t3),
                ee2 && !t3 && ee2.kill(),
                a2 && delete Tt[a2]);
              var r3 = kt.indexOf(ke2);
              (0 <= r3 && kt.splice(r3, 1),
                r3 === Qe && 0 < Mt && Qe--,
                (r3 = 0),
                kt.forEach(function (e4) {
                  return e4.scroller === ke2.scroller && (r3 = 1);
                }),
                r3 || rt || (ke2.scroll.rec = 0),
                O2 &&
                  ((O2.scrollTrigger = null),
                  e3 && O2.revert({ kill: !1 }),
                  t3 || O2.kill()),
                I2 &&
                  [I2, Y2, q2, H2].forEach(function (e4) {
                    return e4.parentNode && e4.parentNode.removeChild(e4);
                  }),
                ot === ke2 && (ot = 0),
                ae2 &&
                  (n2 && (n2.uncache = 1),
                  (r3 = 0),
                  kt.forEach(function (e4) {
                    return e4.pin === ae2 && r3++;
                  }),
                  r3 || (n2.spacer = 0)),
                E2.onKill && E2.onKill(ke2));
            }),
            kt.push(ke2),
            ke2.enable(!1, !1),
            i2 && i2(ke2),
            O2 && O2.add && !N2)
          ) {
            var v2 = ke2.update;
            ((ke2.update = function () {
              ((ke2.update = v2), D2 || F2 || ke2.refresh());
            }),
              Le.delayedCall(0.01, ke2.update),
              (N2 = 0.01),
              (D2 = F2 = 0));
          } else ke2.refresh();
          ae2 &&
            (function () {
              if (nt !== Ct) {
                var e3 = (nt = Ct);
                requestAnimationFrame(function () {
                  return e3 === Ct && Pt(!0);
                });
              }
            })();
        } else this.update = this.refresh = this.kill = Fa;
      }),
      (ScrollTrigger.register = function (e2) {
        return (
          s ||
            ((Le = e2 || Ia()),
            Ha() && window.document && ScrollTrigger.enable(),
            (s = lt)),
          s
        );
      }),
      (ScrollTrigger.defaults = function (e2) {
        if (e2) for (var t2 in e2) St[t2] = e2[t2];
        return St;
      }),
      (ScrollTrigger.disable = function (t2, r2) {
        ((lt = 0),
          kt.forEach(function (e3) {
            return e3[r2 ? "kill" : "disable"](t2);
          }),
          vb(Ne, "wheel", Hb),
          vb(Xe, "scroll", Hb),
          clearInterval(u),
          vb(Xe, "touchcancel", Fa),
          vb(We, "touchstart", Fa),
          tb(vb, Xe, "pointerdown,touchstart,mousedown", Da),
          tb(vb, Xe, "pointerup,touchend,mouseup", Ea),
          c.kill(),
          Pa(vb));
        for (var e2 = 0; e2 < ze.length; e2 += 3)
          (wb(vb, ze[e2], ze[e2 + 1]), wb(vb, ze[e2], ze[e2 + 2]));
      }),
      (ScrollTrigger.enable = function () {
        if (
          ((Ne = window),
          (Xe = document),
          (Je = Xe.documentElement),
          (We = Xe.body),
          Le &&
            ((Ge = Le.utils.toArray),
            (Ve = Le.utils.clamp),
            (x = Le.core.context || Fa),
            (et = Le.core.suppressOverwrites || Fa),
            (_ = Ne.history.scrollRestoration || "auto"),
            (j = Ne.pageYOffset),
            Le.core.globals("ScrollTrigger", ScrollTrigger),
            We))
        ) {
          ((lt = 1),
            ((w = document.createElement("div")).style.height = "100vh"),
            (w.style.position = "absolute"),
            Wb(),
            (function _rafBugFix() {
              return lt && requestAnimationFrame(_rafBugFix);
            })(),
            E.register(Le),
            (ScrollTrigger.isTouch = E.isTouch),
            (R =
              E.isTouch && /(iPad|iPhone|iPod|Mac)/g.test(navigator.userAgent)),
            ub(Ne, "wheel", Hb),
            (l = [Ne, Xe, Je, We]),
            Le.matchMedia
              ? ((ScrollTrigger.matchMedia = function (e3) {
                  var t3,
                    r3 = Le.matchMedia();
                  for (t3 in e3) r3.add(t3, e3[t3]);
                  return r3;
                }),
                Le.addEventListener("matchMediaInit", function () {
                  return Qb();
                }),
                Le.addEventListener("matchMediaRevert", function () {
                  return Pb();
                }),
                Le.addEventListener("matchMedia", function () {
                  (Pt(0, 1), V("matchMedia"));
                }),
                Le.matchMedia("(orientation: portrait)", function () {
                  return (Ib(), Ib);
                }))
              : console.warn("Requires GSAP 3.11.0 or later"),
            Ib(),
            ub(Xe, "scroll", Hb));
          var e2,
            t2,
            r2 = We.style,
            n2 = r2.borderTopStyle,
            o2 = Le.core.Animation.prototype;
          for (
            o2.revert ||
              Object.defineProperty(o2, "revert", {
                value: function () {
                  return this.time(-0.01, !0);
                },
              }),
              r2.borderTopStyle = "solid",
              e2 = _t(We),
              He.m = Math.round(e2.top + He.sc()) || 0,
              qe.m = Math.round(e2.left + qe.sc()) || 0,
              n2
                ? (r2.borderTopStyle = n2)
                : r2.removeProperty("border-top-style"),
              u = setInterval(Gb, 250),
              Le.delayedCall(0.5, function () {
                return (it = 0);
              }),
              ub(Xe, "touchcancel", Fa),
              ub(We, "touchstart", Fa),
              tb(ub, Xe, "pointerdown,touchstart,mousedown", Da),
              tb(ub, Xe, "pointerup,touchend,mouseup", Ea),
              f = Le.utils.checkPrefix("transform"),
              Z.push(f),
              s = at(),
              c = Le.delayedCall(0.2, Pt).pause(),
              g = [
                Xe,
                "visibilitychange",
                function () {
                  var e3 = Ne.innerWidth,
                    t3 = Ne.innerHeight;
                  Xe.hidden
                    ? ((d = e3), (p = t3))
                    : (d === e3 && p === t3) || Jb();
                },
                Xe,
                "DOMContentLoaded",
                Pt,
                Ne,
                "load",
                Pt,
                Ne,
                "resize",
                Jb,
              ],
              Pa(ub),
              kt.forEach(function (e3) {
                return e3.enable(0, 1);
              }),
              t2 = 0;
            t2 < ze.length;
            t2 += 3
          )
            (wb(vb, ze[t2], ze[t2 + 1]), wb(vb, ze[t2], ze[t2 + 2]));
        }
      }),
      (ScrollTrigger.config = function (e2) {
        "limitCallbacks" in e2 && (tt = !!e2.limitCallbacks);
        var t2 = e2.syncInterval;
        ((t2 && clearInterval(u)) || ((u = t2) && setInterval(Gb, t2)),
          "ignoreMobileResize" in e2 &&
            (b = ScrollTrigger.isTouch === 1 && e2.ignoreMobileResize),
          "autoRefreshEvents" in e2 &&
            (Pa(vb) || Pa(ub, e2.autoRefreshEvents || "none"),
            (h = (e2.autoRefreshEvents + "").indexOf("resize") === -1)));
      }),
      (ScrollTrigger.scrollerProxy = function (e2, t2) {
        var r2 = J(e2),
          n2 = ze.indexOf(r2),
          o2 = Ja(r2);
        (~n2 && ze.splice(n2, o2 ? 6 : 2),
          t2 && (o2 ? Ie.unshift(Ne, t2, We, t2, Je, t2) : Ie.unshift(r2, t2)));
      }),
      (ScrollTrigger.clearMatchMedia = function (t2) {
        kt.forEach(function (e2) {
          return e2._ctx && e2._ctx.query === t2 && e2._ctx.kill(!0, !0);
        });
      }),
      (ScrollTrigger.isInViewport = function (e2, t2, r2) {
        var n2 = (ct(e2) ? J(e2) : e2).getBoundingClientRect(),
          o2 = n2[r2 ? ft : dt] * t2 || 0;
        return r2
          ? 0 < n2.right - o2 && n2.left + o2 < Ne.innerWidth
          : 0 < n2.bottom - o2 && n2.top + o2 < Ne.innerHeight;
      }),
      (ScrollTrigger.positionInViewport = function (e2, t2, r2) {
        ct(e2) && (e2 = J(e2));
        var n2 = e2.getBoundingClientRect(),
          o2 = n2[r2 ? ft : dt],
          i2 =
            t2 == null
              ? o2 / 2
              : t2 in q
                ? q[t2] * o2
                : ~t2.indexOf("%")
                  ? (parseFloat(t2) * o2) / 100
                  : parseFloat(t2) || 0;
        return r2
          ? (n2.left + i2) / Ne.innerWidth
          : (n2.top + i2) / Ne.innerHeight;
      }),
      (ScrollTrigger.killAll = function (e2) {
        if (
          (kt.slice(0).forEach(function (e3) {
            return e3.vars.id !== "ScrollSmoother" && e3.kill();
          }),
          e2 !== !0)
        ) {
          var t2 = X.killAll || [];
          ((X = {}),
            t2.forEach(function (e3) {
              return e3();
            }));
        }
      }),
      ScrollTrigger);
  function ScrollTrigger(e2, t2) {
    (s ||
      ScrollTrigger.register(Le) ||
      console.warn("Please gsap.registerPlugin(ScrollTrigger)"),
      x(this),
      this.init(e2, t2));
  }
  ((re.version = "3.12.2"),
    (re.saveStyles = function (e2) {
      return e2
        ? Ge(e2).forEach(function (e3) {
            if (e3 && e3.style) {
              var t2 = U.indexOf(e3);
              (0 <= t2 && U.splice(t2, 5),
                U.push(
                  e3,
                  e3.style.cssText,
                  e3.getBBox && e3.getAttribute("transform"),
                  Le.core.getCache(e3),
                  x(),
                ));
            }
          })
        : U;
    }),
    (re.revert = function (e2, t2) {
      return Qb(!e2, t2);
    }),
    (re.create = function (e2, t2) {
      return new re(e2, t2);
    }),
    (re.refresh = function (e2) {
      return e2 ? Jb() : (s || re.register()) && Pt(!0);
    }),
    (re.update = function (e2) {
      return ++ze.cache && Q(e2 === !0 ? 2 : 0);
    }),
    (re.clearScrollMemory = Rb),
    (re.maxScroll = function (e2, t2) {
      return Oa(e2, t2 ? qe : He);
    }),
    (re.getScrollFunc = function (e2, t2) {
      return K(J(e2), t2 ? qe : He);
    }),
    (re.getById = function (e2) {
      return Tt[e2];
    }),
    (re.getAll = function () {
      return kt.filter(function (e2) {
        return e2.vars.id !== "ScrollSmoother";
      });
    }),
    (re.isScrolling = function () {
      return !!st;
    }),
    (re.snapDirectional = rb),
    (re.addEventListener = function (e2, t2) {
      var r2 = X[e2] || (X[e2] = []);
      ~r2.indexOf(t2) || r2.push(t2);
    }),
    (re.removeEventListener = function (e2, t2) {
      var r2 = X[e2],
        n2 = r2 && r2.indexOf(t2);
      0 <= n2 && r2.splice(n2, 1);
    }),
    (re.batch = function (e2, t2) {
      function up(e3, t3) {
        var r3 = [],
          n3 = [],
          o3 = Le.delayedCall(i2, function () {
            (t3(r3, n3), (r3 = []), (n3 = []));
          }).pause();
        return function (e4) {
          (r3.length || o3.restart(!0),
            r3.push(e4.trigger),
            n3.push(e4),
            a2 <= r3.length && o3.progress(1));
        };
      }
      var r2,
        n2 = [],
        o2 = {},
        i2 = t2.interval || 0.016,
        a2 = t2.batchMax || 1e9;
      for (r2 in t2)
        o2[r2] =
          r2.substr(0, 2) === "on" && Ra(t2[r2]) && r2 !== "onRefreshInit"
            ? up(0, t2[r2])
            : t2[r2];
      return (
        Ra(a2) &&
          ((a2 = a2()),
          ub(re, "refresh", function () {
            return (a2 = t2.batchMax());
          })),
        Ge(e2).forEach(function (e3) {
          var t3 = {};
          for (r2 in o2) t3[r2] = o2[r2];
          ((t3.trigger = e3), n2.push(re.create(t3)));
        }),
        n2
      );
    }));
  function qc(e2, t2, r2, n2) {
    return (
      n2 < t2 ? e2(n2) : t2 < 0 && e2(0),
      n2 < r2 ? (n2 - t2) / (r2 - t2) : r2 < 0 ? t2 / (t2 - r2) : 1
    );
  }
  function rc(e2, t2) {
    (t2 === !0
      ? e2.style.removeProperty("touch-action")
      : (e2.style.touchAction =
          t2 === !0
            ? "auto"
            : t2
              ? "pan-" + t2 + (E.isTouch ? " pinch-zoom" : "")
              : "none"),
      e2 === Je && rc(We, t2));
  }
  function tc(e2) {
    var t2,
      r2 = e2.event,
      n2 = e2.target,
      o2 = e2.axis,
      i2 = (r2.changedTouches ? r2.changedTouches[0] : r2).target,
      a2 = i2._gsap || Le.core.getCache(i2),
      s2 = at();
    if (!a2._isScrollT || 2e3 < s2 - a2._isScrollT) {
      for (
        ;
        i2 &&
        i2 !== We &&
        ((i2.scrollHeight <= i2.clientHeight &&
          i2.scrollWidth <= i2.clientWidth) ||
          (!oe[(t2 = kb(i2)).overflowY] && !oe[t2.overflowX]));
      )
        i2 = i2.parentNode;
      ((a2._isScroll =
        i2 &&
        i2 !== n2 &&
        !Ja(i2) &&
        (oe[(t2 = kb(i2)).overflowY] || oe[t2.overflowX])),
        (a2._isScrollT = s2));
    }
    (!a2._isScroll && o2 !== "x") ||
      (r2.stopPropagation(), (r2._gsapAllow = !0));
  }
  function uc(e2, t2, r2, n2) {
    return E.create({
      target: e2,
      capture: !0,
      debounce: !1,
      lockAxis: !0,
      type: t2,
      onWheel: (n2 = n2 && tc),
      onPress: n2,
      onDrag: n2,
      onScroll: n2,
      onEnable: function () {
        return r2 && ub(Xe, E.eventTypes[0], ae, !1, !0);
      },
      onDisable: function () {
        return vb(Xe, E.eventTypes[0], ae, !0);
      },
    });
  }
  function yc(e2) {
    function rq() {
      return (o2 = !1);
    }
    function uq() {
      ((i2 = Oa(p2, He)),
        (T2 = Ve(R ? 1 : 0, i2)),
        f2 && (k2 = Ve(0, Oa(p2, qe))),
        (l2 = Ct));
    }
    function vq() {
      ((v2._gsap.y = Ga(parseFloat(v2._gsap.y) + b2.offset) + "px"),
        (v2.style.transform =
          "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " +
          parseFloat(v2._gsap.y) +
          ", 0, 1)"),
        (b2.offset = b2.cacheID = 0));
    }
    function Bq() {
      (uq(),
        a2.isActive() &&
          a2.vars.scrollY > i2 &&
          (b2() > i2 ? a2.progress(1) && b2(i2) : a2.resetTo("scrollY", i2)));
    }
    (Ta(e2) || (e2 = {}),
      (e2.preventDefault = e2.isNormalizer = e2.allowClicks = !0),
      e2.type || (e2.type = "wheel,touch"),
      (e2.debounce = !!e2.debounce),
      (e2.id = e2.id || "normalizer"));
    var n2,
      i2,
      l2,
      o2,
      a2,
      c2,
      u2,
      s2,
      f2 = e2.normalizeScrollX,
      t2 = e2.momentum,
      r2 = e2.allowNestedScroll,
      d2 = e2.onRelease,
      p2 = J(e2.target) || Je,
      g2 = Le.core.globals().ScrollSmoother,
      h2 = g2 && g2.get(),
      v2 =
        R &&
        ((e2.content && J(e2.content)) ||
          (h2 && e2.content !== !1 && !h2.smooth() && h2.content())),
      b2 = K(p2, He),
      m2 = K(p2, qe),
      y2 = 1,
      x2 =
        (E.isTouch && Ne.visualViewport
          ? Ne.visualViewport.scale * Ne.visualViewport.width
          : Ne.outerWidth) / Ne.innerWidth,
      _2 = 0,
      w2 = Ra(t2)
        ? function () {
            return t2(n2);
          }
        : function () {
            return t2 || 2.8;
          },
      S2 = uc(p2, e2.type, !0, r2),
      k2 = Fa,
      T2 = Fa;
    return (
      v2 && Le.set(v2, { y: "+=0" }),
      (e2.ignoreCheck = function (e3) {
        return (
          (R &&
            e3.type === "touchmove" &&
            (function () {
              if (o2) {
                requestAnimationFrame(rq);
                var e4 = Ga(n2.deltaY / 2),
                  t3 = T2(b2.v - e4);
                if (v2 && t3 !== b2.v + b2.offset) {
                  b2.offset = t3 - b2.v;
                  var r3 = Ga((parseFloat(v2 && v2._gsap.y) || 0) - b2.offset);
                  ((v2.style.transform =
                    "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " +
                    r3 +
                    ", 0, 1)"),
                    (v2._gsap.y = r3 + "px"),
                    (b2.cacheID = ze.cache),
                    Q());
                }
                return !0;
              }
              (b2.offset && vq(), (o2 = !0));
            })()) ||
          (1.05 < y2 && e3.type !== "touchstart") ||
          n2.isGesturing ||
          (e3.touches && 1 < e3.touches.length)
        );
      }),
      (e2.onPress = function () {
        o2 = !1;
        var e3 = y2;
        ((y2 = Ga(((Ne.visualViewport && Ne.visualViewport.scale) || 1) / x2)),
          a2.pause(),
          e3 !== y2 && rc(p2, 1.01 < y2 || (!f2 && "x")),
          (c2 = m2()),
          (u2 = b2()),
          uq(),
          (l2 = Ct));
      }),
      (e2.onRelease = e2.onGestureStart =
        function (e3, t3) {
          if ((b2.offset && vq(), t3)) {
            ze.cache++;
            var r3,
              n3,
              o3 = w2();
            (f2 &&
              ((n3 = (r3 = m2()) + (0.05 * o3 * -e3.velocityX) / 0.227),
              (o3 *= qc(m2, r3, n3, Oa(p2, qe))),
              (a2.vars.scrollX = k2(n3))),
              (n3 = (r3 = b2()) + (0.05 * o3 * -e3.velocityY) / 0.227),
              (o3 *= qc(b2, r3, n3, Oa(p2, He))),
              (a2.vars.scrollY = T2(n3)),
              a2.invalidate().duration(o3).play(0.01),
              ((R && a2.vars.scrollY >= i2) || i2 - 1 <= r3) &&
                Le.to({}, { onUpdate: Bq, duration: o3 }));
          } else s2.restart(!0);
          d2 && d2(e3);
        }),
      (e2.onWheel = function () {
        (a2._ts && a2.pause(), 1e3 < at() - _2 && ((l2 = 0), (_2 = at())));
      }),
      (e2.onChange = function (e3, t3, r3, n3, o3) {
        if (
          (Ct !== l2 && uq(),
          t3 &&
            f2 &&
            m2(k2(n3[2] === t3 ? c2 + (e3.startX - e3.x) : m2() + t3 - n3[1])),
          r3)
        ) {
          b2.offset && vq();
          var i3 = o3[2] === r3,
            a3 = i3 ? u2 + e3.startY - e3.y : b2() + r3 - o3[1],
            s3 = T2(a3);
          (i3 && a3 !== s3 && (u2 += s3 - a3), b2(s3));
        }
        (r3 || t3) && Q();
      }),
      (e2.onEnable = function () {
        (rc(p2, !f2 && "x"),
          re.addEventListener("refresh", Bq),
          ub(Ne, "resize", Bq),
          b2.smooth &&
            ((b2.target.style.scrollBehavior = "auto"),
            (b2.smooth = m2.smooth = !1)),
          S2.enable());
      }),
      (e2.onDisable = function () {
        (rc(p2, !0),
          vb(Ne, "resize", Bq),
          re.removeEventListener("refresh", Bq),
          S2.kill());
      }),
      (e2.lockAxis = e2.lockAxis !== !1),
      ((n2 = new E(e2)).iOS = R) && !b2() && b2(1),
      R && Le.ticker.add(Fa),
      (s2 = n2._dc),
      (a2 = Le.to(n2, {
        ease: "power4",
        paused: !0,
        scrollX: f2 ? "+=0.1" : "+=0",
        scrollY: "+=0.1",
        modifiers: {
          scrollY: mc(b2, b2(), function () {
            return a2.pause();
          }),
        },
        onUpdate: Q,
        onComplete: s2.vars.onComplete,
      })),
      n2
    );
  }
  var ne,
    oe = { auto: 1, scroll: 1 },
    ie = /(input|label|select|textarea)/i,
    ae = function (e2) {
      var t2 = ie.test(e2.target.tagName);
      (t2 || ne) && ((e2._gsapAllow = !0), (ne = t2));
    };
  ((re.sort = function (e2) {
    return kt.sort(
      e2 ||
        function (e3, t2) {
          return (
            -1e6 * (e3.vars.refreshPriority || 0) +
            e3.start -
            (t2.start + -1e6 * (t2.vars.refreshPriority || 0))
          );
        },
    );
  }),
    (re.observe = function (e2) {
      return new E(e2);
    }),
    (re.normalizeScroll = function (e2) {
      if (e2 === void 0) return v;
      if (e2 === !0 && v) return v.enable();
      if (e2 === !1) return v && v.kill();
      var t2 = e2 instanceof E ? e2 : yc(e2);
      return (
        v && v.target === t2.target && v.kill(),
        Ja(t2.target) && (v = t2),
        t2
      );
    }),
    (re.core = {
      _getVelocityProp: L,
      _inputObserver: uc,
      _scrollers: ze,
      _proxies: Ie,
      bridge: {
        ss: function () {
          (st || V("scrollStart"), (st = at()));
        },
        ref: function () {
          return je;
        },
      },
    }),
    Ia() && Le.registerPlugin(re),
    (e.ScrollTrigger = re),
    (e.default = re),
    typeof window == "undefined" || window !== e
      ? Object.defineProperty(e, "__esModule", { value: !0 })
      : delete e.default);
});
//# sourceMappingURL=/cdn/shop/t/8/assets/scrollTrigger.js.map?v=4549089651008514231754290580
