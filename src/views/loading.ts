// @ts-nocheck

const template = document.createElement('template');

//innerHtml from codepen: https://codepen.io/mrrocks/pen/EiplA
template.innerHTML = `
<style>
html, body {
  height: 100%;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  -webkit-animation: rotator 1.4s linear infinite;
          animation: rotator 1.4s linear infinite;
}

.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column
}


@-webkit-keyframes rotator {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(270deg);
  }
}

@keyframes rotator {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(270deg);
  }
}
.path {
  stroke-dasharray: 187;
  stroke-dashoffset: 0;
  transform-origin: center;
  -webkit-animation: dash 1.4s ease-in-out infinite, colors 5.6s ease-in-out infinite;
          animation: dash 1.4s ease-in-out infinite, colors 5.6s ease-in-out infinite;
}

@-webkit-keyframes colors {
  0% {
    stroke: #4285F4;
  }
  100% {
    stroke: #4285F4;
  }
}

@keyframes colors {
  0% {
    stroke: #4285F4;
  }
  100% {
    stroke: #4285F4;
  }
}
@-webkit-keyframes dash {
  0% {
    stroke-dashoffset: 187;
  }
  50% {
    stroke-dashoffset: 46.75;
    transform: rotate(135deg);
  }
  100% {
    stroke-dashoffset: 187;
    transform: rotate(450deg);
  }
}
@keyframes dash {
  0% {
    stroke-dashoffset: 187;
  }
  50% {
    stroke-dashoffset: 46.75;
    transform: rotate(135deg);
  }
  100% {
    stroke-dashoffset: 187;
    transform: rotate(450deg);
  }
}
</style>
<div class="wrapper">
  <svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
    <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
  </svg>
  <h2>  </h2>
</div>
`;

class LoadingComponent extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.displayVal = this.shadowRoot!.querySelector('h2');

        if (this.hasAttribute('label')) {
            this.displayVal!.innerText = this.label;
        }
    }

    get label() {
        return this.getAttribute('label');
    }
}

customElements.define('loading-component', LoadingComponent);

export default LoadingComponent;
