import { mount } from '@vue/test-utils';
import MockDate from 'mockdate';
import { nextTick } from 'vue';
import { BrowseIcon, LockOnIcon } from 'tdesign-icons-vue';
import dayjs from 'dayjs';
import DatePicker from '@/src/date-picker/index.ts';

// 固定时间，当使用 new Date() 时，返回固定时间，防止“当前时间”的副作用影响，导致 snapshot 变更，mockdate 插件见 https://github.com/boblauer/MockDate
MockDate.set('2020-12-28');

// every component needs four parts: props/events/slots/functions.
describe('DatePicker', () => {
  // test props api
  describe(':props', () => {
    it('', () => {
      const wrapper = mount({
        render() {
          return <DatePicker />;
        },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });

  it(':value', () => {
    const wrapper = mount({
      render() {
        return <DatePicker value={'1998-11-11'} />;
      },
    });
    expect(wrapper.element).toMatchSnapshot();
  });

  it(':mode', () => {
    const wrapper = mount({
      render() {
        return <DatePicker mode={'year'} />;
      },
    });
    expect(wrapper.element).toMatchSnapshot();
  });

  it(':range', () => {
    const wrapper = mount({
      render() {
        const testRange = [
          '2018-08', // new Date(2017, 7)
          '2028-04', // new Date(2027, 3)
        ];
        return <DatePicker value={testRange} range />;
      },
    });
    expect(wrapper.element).toMatchSnapshot();
  });

  it('clearable', async () => {
    const wrapper = mount({
      render() {
        return <DatePicker defaultValue={'2022-09-14'} clearable></DatePicker>;
      },
    });
    const input = wrapper.find('.t-input');
    await input.trigger('mouseenter');
    await nextTick();
    expect(wrapper.find('.t-input__suffix-clear').exists()).toBeTruthy();
  });

  it('disabled', () => {
    const wrapper = mount({
      render() {
        return <DatePicker disabled />;
      },
    });
    const inputInner = wrapper.find('.t-input__inner');
    expect(inputInner.element.disabled).toBe(true);
  });

  it('enableTimePicker', async () => {
    const wrapper = mount({
      render() {
        return <DatePicker enableTimePicker />;
      },
    });
    wrapper.find('.t-input').trigger('click');
    await nextTick();
    expect(document.querySelector('.t-date-picker__panel-time')).not.toBe(null);
  });

  it('firstDayOfWeek', async () => {
    const wrapper = mount(DatePicker, {
      propsData: {
        firstDayOfWeek: 3,
      },
    });
    wrapper.find('.t-input').trigger('click');
    await nextTick();
    const weekElement = document.querySelector('.t-date-picker__table table thead tr th');
    expect(weekElement.innerHTML).toEqual('一');
  });

  it('format', async () => {
    // defaultValue
    const wrapper = mount({
      render() {
        return <DatePicker defaultValue={'2022-09-14 16:30:20'} format={'YYYY-MM-DD'} />;
      },
    });
    const inputElement1 = wrapper.find('.t-input__inner');
    expect(inputElement1.element.value).toEqual('2022-09-14');

    // value
    const wrapper2 = mount({
      render() {
        return <DatePicker value={'2022-09-14 16:30:20'} format={'YYYY-MM-DD'} />;
      },
    });
    const inputElement2 = wrapper2.find('.t-input__inner');
    expect(inputElement2.element.value).toEqual('2022-09-14');
  });

  it('inputProps', () => {
    const wrapper = mount(DatePicker, {
      propsData: {
        inputProps: { inputClass: 'test-inputClass' },
      },
    });
    expect(wrapper.find('.t-input').classes()).toContain('test-inputClass');
  });

  it('mode week', async () => {
    const wrapper = mount({
      render() {
        return <DatePicker mode={'week'} value={'2022-37th'} />;
      },
    });
    wrapper.find('.t-input').trigger('click');
    await nextTick();
    expect(document.querySelector('.t-date-picker__panel-week')).not.toBe(null);
  });

  it('mode month', async () => {
    const wrapper = mount({
      render() {
        return <DatePicker mode={'month'} />;
      },
    });
    wrapper.find('.t-input').trigger('click');
    await nextTick();
    expect(document.querySelector('.t-date-picker__panel-month')).not.toBe(null);
  });
  // #3922: firstDayOfWeek 与 locale 周起始不一致时，面板一行跨越两个自然周，
  // 点击行内后半周的格子会写入下一周的周数（点标注 52 的行会选中 53 周）。
  // 修复：week 多选点击按行首（周数列标注）所在周写入与取消。
  it('mode week multiple: clicking any cell of a week row selects that row (#3922)', async () => {
    const App = {
      components: { DatePicker },
      data() {
        return { week: [] };
      },
      template: '<date-picker v-model="week" mode="week" multiple clearable :first-day-of-week="7" />',
    };
    // 先清空残留 DOM，面板 popup 挂在 body 上，避免其他用例残留的面板节点干扰
    document.body.innerHTML = '';
    const wrapper = mount(App, { attachToDocument: true });
    await nextTick();
    wrapper.find('.t-input').trigger('click');
    await nextTick();
    await nextTick();
    const panel = document.querySelector('.t-date-picker__panel-week');
    expect(panel).not.toBe(null);
    const rows = panel.querySelectorAll('tbody tr');
    let row52Index = -1;
    rows.forEach((tr, i) => {
      if (tr.querySelectorAll('td')[0].textContent.trim() === '52' && row52Index < 0) row52Index = i;
    });
    expect(row52Index).toBeGreaterThanOrEqual(0);
    // 点击标注 52 的行内的 12-28（周一；修复前写入 2020-53周，修复后写入 2020-52周）
    rows[row52Index].querySelectorAll('td')[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(wrapper.vm.week).toEqual(['2020-52周']);
    // 高亮必须落在标注 52 的行上
    expect(rows[row52Index].className.includes('--active')).toBe(true);
    wrapper.destroy();
    document.body.innerHTML = '';
  });


  it('mode quarter', async () => {
    const wrapper = mount({
      render() {
        return <DatePicker mode={'quarter'} />;
      },
    });
    wrapper.find('.t-input').trigger('click');
    await nextTick();
    expect(document.querySelector('.t-date-picker__panel-quarter')).not.toBe(null);
  });

  it('mode year', async () => {
    const wrapper = mount({
      render() {
        return <DatePicker mode={'year'} />;
      },
    });
    wrapper.find('.t-input').trigger('click');
    await nextTick();
    expect(document.querySelector('.t-date-picker__panel-year')).not.toBe(null);
  });

  it('placeholder', () => {
    const wrapper = mount({
      render() {
        return <DatePicker />;
      },
    });
    expect(wrapper.find('input').element.placeholder).toEqual('请选择日期');
  });

  it('popupProps', async () => {
    const wrapper = mount({
      render() {
        return <DatePicker popupProps={{ showArrow: true }} />;
      },
    });
    wrapper.find('.t-input').trigger('click');
    await nextTick();
    expect(document.querySelector('.t-popup__arrow')).not.toBe(null);
  });

  it('prefixIcon suffixIcon', () => {
    const wrapper = mount({
      render() {
        return <DatePicker prefixIcon={() => <BrowseIcon />} suffixIcon={() => <LockOnIcon />} />;
      },
    });
    expect(wrapper.find('.t-icon-browse')).not.toBe(null);
    expect(wrapper.find('.t-icon-lock-on')).not.toBe(null);
  });

  it('presets bottom top', async () => {
    const presets = {
      昨天: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    };
    const wrapper = mount({
      render() {
        return <DatePicker presets={presets} />;
      },
    });
    wrapper.find('.t-input').trigger('click');
    await nextTick();
    expect(document.querySelector('.t-date-picker__presets .t-button__text').innerHTML).toContain('昨天');
  });

  test('status', () => {
    const wrapper = mount({
      render() {
        return <DatePicker status={'warning'} />;
      },
    });
    expect(wrapper.find('.t-input').classes()).toContain('t-is-warning');
  });

  // test exposure function
  describe('function', () => {
    it('onBlur', async () => {
      const blurFn = vi.fn();
      const wrapper = mount({
        render() {
          return <DatePicker allowInput onBlur={blurFn} />;
        },
      });
      const InputDom = wrapper.find('input');
      InputDom.trigger('blur');
      expect(blurFn).toBeCalledTimes(1);
    });
  });
});
