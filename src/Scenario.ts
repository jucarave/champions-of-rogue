abstract class Scenario {
    onMouseMove(x: number, y: number) { x + y; }
    onMouseHandler(x: number, y: number, stat: number) { x + y + stat; }
    render() { }
}

export { Scenario };