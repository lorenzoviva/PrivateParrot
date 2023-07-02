window.TagBox = class TagBox {
    constructor(tagInputId) {
        this.tagInput = document.getElementById(tagInputId);
        this.ul = this.tagInput.parentElement;
        this.tagArea = this.ul.parentElement;
        this.tags = [];
        this.addEvent(this.tagInput);
    }

    addEvent(element) {
        this.tagArea.addEventListener("click", () => {
            element.focus();
        });

        element.addEventListener("focus", () => {
            this.tagArea.classList.add("active");
        });

        element.addEventListener("blur", (e) => {
            this.tagArea.classList.remove("active");
            if (!element.value.match(/^[\r\n]+$/gi) && element.value !== "") {
                this.tags.push(e.target.value.trim());
                element.value = "";
                this.renderTags();
            }
        });

        element.addEventListener("keydown", (e) => {
            // console.log(e);
            const value = e.target.value;
            if (e.keyCode === 13 &&
                !value.match(/^[\r\n]+$/gi) &&
                value !== ""
            ) {
                this.tags.push(e.target.value.trim());
                element.value = "";
                this.renderTags();
            }
            if (e.keyCode === 8 && value === "") {
                this.tags.pop();
                this.renderTags();
            }
        });
    }
    addTags(...tags){
        this.tags.push(...tags)
        this.renderTags();
    }

    renderTags() {
        const inputCopy = this.tagInput.cloneNode(true);
        this.ul.innerHTML = "";
        this.tags.forEach((tag, index) => {
            this.createTag(tag, index);
        });
        this.tagInput = inputCopy
        this.addEvent(inputCopy);
        this.ul.appendChild(inputCopy);
        inputCopy.focus();
        setTimeout(() => (inputCopy.value = ""), 0);
    }

    createTag(tag, index) {
        const li = document.createElement("li");
        li.className = "tag";
        const text = document.createTextNode(tag);
        const span = document.createElement("span");
        span.className = "cross";
        span.dataset.index = index;
        span.addEventListener("click", (e) => {
            this.tags = this.tags.filter((_, index) => index != e.target.dataset.index);
            this.renderTags();
        });
        li.appendChild(text);
        li.appendChild(span);
        this.ul.appendChild(li);
    }
}